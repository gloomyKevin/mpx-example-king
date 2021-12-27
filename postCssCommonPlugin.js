const fg = require('fast-glob');
const fs = require('fs');
const path = require('path')
const postcss = require('postcss');

const commonStyle = '/commonStyle.css'

const example = ['dist/wx/subpackage/subpackage1/','dist/wx/subpackage/subpackage2/']

const fileRoot = 'dist/wx'
// console.log('dadasfasf',fg.sync('dist/wx/**', { onlyFiles: false, deep: 1 }))
const normalizeFiles = (fileDir = [], fileRoot = 'dist/wx', needAllFileClass = false) => {
  if(needAllFileClass && !fileRoot){
    console.log('如果是需要提取整个文件的公共样式, 需要写扫描文件入口! 如果不需要可以不传 needAllFileClass 参数')
    return
  }
  let files = []
  const subpackageFiles = {}
  const allFiles = {}
  if(needAllFileClass && !fileDir.length){ //扫描所有文件
    fileDir = ['**/*.wxss']
  }else if(needAllFileClass && fileDir.length){ //扫描部分分包和总目录下所有wxss
    fileDir = fileDir.map((path)=>{
      return path + '**/*.wxss'
    })
    fileDir = fileDir.concat([`${fileRoot}/pages/**/*.wxss`,`${fileRoot}/components/**/*.wxss`])
  }else if(!needAllFileClass && fileDir.length){ //只需要扫描部分分包 
    fileDir = fileDir.map((path)=>{
      return path + '**/*.wxss'
    })
  }
  if(files.includes(`${fileRoot}/app.wxss`)){
    const appIndex = files.findIndex(`${fileRoot}/app.wxss`)
    files.split(appIndex,1)
  }
  files = fg.sync(fileDir);
  // console.log('files',files)
  files.map((file)=>{
    if(!allFiles[path.resolve(file,'../../')] && 
      (file.includes(`${fileRoot}/pages`) || file.includes(`${fileRoot}/components`))
    ){
      allFiles[path.resolve(file,'../../')] = []
    }

    if(!subpackageFiles[path.resolve(file,'../../../')] && 
      (!file.includes(`${fileRoot}/pages`) && !file.includes(`${fileRoot}/components`))
      ){
      subpackageFiles[path.resolve(file,'../../../')] = []
    }

    if(allFiles[path.resolve(file,'../../')] && 
      (file.includes(`${fileRoot}/pages`) || file.includes(`${fileRoot}/components`))){
      allFiles[path.resolve(file,'../../')].push(file)
    }
    
    if(subpackageFiles[path.resolve(file,'../../../')] &&
      (!file.includes(`${fileRoot}/pages`) && !file.includes(`${fileRoot}/components`))
      ){
      subpackageFiles[path.resolve(file,'../../../')].push(file)
    }
  })
  return {
    allFiles,
    subpackageFiles
  }
}

const collectClass = async (Files) => {
  if(!Object.keys(Files).length) return 

  let AllClass = {}
  let promiseArr = []

  for(let filePackage in Files){
    AllClass[filePackage]= new Array(Files[filePackage].length)
    Files[filePackage].forEach((file,index)=>{
      AllClass[filePackage][index]=[]
      promiseArr.push(
        new Promise((resolve,reject)=>{
          fs.readFile(file, (err,data) => {
            if(err) reject(err)
            postcss(postCssCollect({
              classCollection: AllClass[filePackage][index]
            })).process(data).then(()=>{
              resolve()
            }).catch((err)=>{
              reject(err)
              console.log(err,'收集class阶段wxss文件执行失败')
            })
          })
        })
      )
    })
  }

  await Promise.all(promiseArr).catch(err=>{
    console.log('postCssCollect err',err)
  })
  return new Promise((resolve,reject) => {
    resolve(AllClass)
  })
}

const postCssCollect = (options = {})  => {
  const classCollection = options.classCollection
  return {
    postcssPlugin:'postcss-get-common',
    Rule(node) {
      if(node.parent.type === 'root'){
        classCollection.push(node.selector)
      }
    },
    AtRule: {
      media: (atRule) => {
        let commonRule = atRule.name + atRule.params 
        atRule.nodes.forEach((rule)=>{
          commonRule += rule.selector
          rule.nodes.forEach((node)=>{
            commonRule += node.prop 
            commonRule += node.value
          })
        })
        classCollection.push(commonRule)
      },
      keyframes: (atRule) => {
        let commonRule = atRule.name + atRule.params 
        atRule.nodes.forEach((rule)=>{
          commonRule += rule.selector
          rule.nodes.forEach((node)=>{
            commonRule += node.prop 
            commonRule += node.value
          })
        })
        classCollection.push(commonRule)
      }
    }
  }
}

const normalizeSubpackageClass = (subpackageFiles,commonClass) => {
  for(let subpackage in subpackageFiles){
    let subpackageCommonRoot = postcss.parse('')
    for(let i in commonClass[subpackage]) { commonClass[subpackage][i] = 1 }
    subpackageFiles[subpackage].map((file)=>{
      fs.readFile(file, (err,data)=>{
        if(err) throw err
        postcss(postCssNormallize({
          subpackageCommonRoot,
          commonClass:commonClass[subpackage],
          importClass:path.join(file,'../../../',`${commonStyle}`)
        })).process(data).then(function(res){
          fs.writeFile(`${file}`,res.css,()=>{
            if (err) throw err;
            // console.log('The file has been saved!');
          })
          fs.writeFile(`${subpackage}${commonStyle}`,subpackageCommonRoot.toString(),()=>{
            if (err) throw err;
            // console.log('The file has been saved!');
          })
        });
      })
    })
  }
}

const normalizeClass = async (files,commonClass,importClass) => {
  for(let i in commonClass) { commonClass[i] = 1 }
  let subpackageCommonRoot = postcss.parse('')
  for(let fileName in files){
    files[fileName].map((file)=>{
      fs.readFile(file, (err,data)=>{
        if(err) throw err
        postcss(postCssNormallize({
          subpackageCommonRoot,
          commonClass:commonClass,
          importClass:path.join(importClass,`${commonStyle}`)
        })).process(data).then(function(res){
          fs.writeFile(`${file}`,res.css,()=>{
            if (err) throw err;
            // console.log('The file has been saved!');
          })
          fs.writeFile(path.join(importClass,`${commonStyle}`),subpackageCommonRoot.toString(),()=>{
            if (err) throw err;
            // console.log('The file has been saved!');
          })
        });
      })
    })
  }
}

const postCssNormallize = (options = {})  => {
  const { subpackageCommonRoot, commonClass, importClass } = options
  let appendImport = false
  return {
    postcssPlugin:'postcss-delete-add',
    Rule(node) {
      if(node.parent.type === 'root'){
        if(commonClass[node.selector]){
          if(!appendImport){
            appendImport = true
            node.parent.prepend(new postcss.AtRule({ name: 'import', params: `\"${importClass}\"` }))
          }
          commonClass[node.selector] === 1 && subpackageCommonRoot.append(node.clone())
          node.parent.removeChild(node)
          commonClass[node.selector] = commonClass[node.selector] + 1
        }
      }
    },
    AtRule: {
      media: (atRule) => {
        let commonAtRule = atRule.name + atRule.params 
        atRule.nodes.forEach((rule)=>{
          commonAtRule += rule.selector
          rule.nodes.forEach((node)=>{
            commonAtRule += node.prop 
            commonAtRule += node.value
          })
        })
        if(commonClass[commonAtRule]){
          if(!appendImport){
            appendImport = true
            atRule.parent.prepend(new postcss.AtRule({ name: 'import', params: `\"${importClass}\"` }))
          }
          commonClass[commonAtRule] === 1 && subpackageCommonRoot.append(atRule.clone())
          atRule.parent.removeChild(atRule)
          commonClass[commonAtRule] += 1
        }
      },
      keyframes: (atRule) => {
        let commonAtRule = atRule.name + atRule.params 
        atRule.nodes.forEach((rule)=>{
          commonAtRule += rule.selector
          rule.nodes.forEach((node)=>{
            commonAtRule += node.prop 
            commonAtRule += node.value
          })
        })
        if(commonClass[commonAtRule]){
          if(!appendImport){
            appendImport = true
            atRule.parent.prepend(new postcss.AtRule({ name: 'import', params: `\"${importClass}\"` }))
          }
          commonClass[commonAtRule] === 1 && subpackageCommonRoot.append(atRule.clone())
          atRule.parent.removeChild(atRule)
          commonClass[commonAtRule] += 1
        }
      }
    }
  }
}

const compareSubpackageClass = (subpackagesArr) => {
  let commonClassObj = {}
  for(let subpackage in subpackagesArr){
    commonClassObj[subpackage] = {}
    subpackagesArr[subpackage].forEach(classItem => {
      classItem.forEach((item) => {
        if(!commonClassObj[subpackage][item]) {
          commonClassObj[subpackage][item] = 1
        }else{
          commonClassObj[subpackage][item] += 1
        }
      })
    })
  }
  for(let commonClass in commonClassObj){
    for(let i in commonClassObj[commonClass]){
      if(commonClassObj[commonClass][i] === 1){
        delete commonClassObj[commonClass][i]
      }
    }
  }
  console.log('compareSubpackageClass',commonClassObj)
  return commonClassObj
}

const compareClass = (filesArr) => {
  let commonClassObj = {}
  for(let file in filesArr){
    filesArr[file].forEach(classItem => {
      if(!commonClassObj[classItem]) {
        commonClassObj[classItem] = 1
      }else{
        commonClassObj[classItem] += 1
      }
    })
  }
  for(let commonClass in commonClassObj){
    if(commonClassObj[commonClass] === 1){
      delete commonClassObj[commonClass]
    }
  }
  console.log('compareClass',commonClassObj)
  return commonClassObj
}

const flattenAndUnique = (classMap) => {
  for(let key in classMap){
    classMap[key] = Array.from(new Set(classMap[key].flat()))
  }
  return classMap
}

const { subpackageFiles, allFiles } = normalizeFiles(example, fileRoot ,true)

// Promise.all([collectClass(allFiles),collectClass(subpackageFiles)]).then((res)=>{
//   const files = Object.assign({},subpackageFiles,allFiles)
//   normalizeClass(files,compareClass(flattenAndUnique(Object.assign({},res[0],res[1]))),fileRoot)
// }).then(()=>{
//   collectClass(subpackageFiles).then((res)=>{
//     normalizeSubpackageClass(subpackageFiles, compareSubpackageClass(res))
//   })
// })


