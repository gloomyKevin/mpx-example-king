const fg = require('fast-glob');
const fs = require('fs');
const fsPromise = require('fs/promises')
const path = require('path')
const postcss = require('postcss');
const shell = require('shelljs')
const chalk = require('chalk')

const args = process.argv.splice(2)

let [commonStyle, fileRoot, cssName, subpackagefileDir, needAllFileClass] = args

const scanFiles = (mainDirs, subpackageDirs, cssName, fileRoot) => {
  let mainfiles = {}, subpackagefiles = {}
  mainDirs.length && mainDirs.forEach(dir=>{
    if(!mainfiles[`${fileRoot}`]) mainfiles[`${fileRoot}`] =[]
    mainfiles[`${fileRoot}`] = mainfiles[`${fileRoot}`].concat(fg.sync([`${dir}/**/*.${cssName}`]))
  })
  subpackageDirs.length && subpackageDirs.forEach(dir=>{
    subpackagefiles[dir]=fg.sync([`${dir}/**/*.${cssName}`]);
  })
  return {
    mainfiles,
    subpackagefiles
  }
}
/**
 * 返回分包目录以及主包特定目录下的所有样式文件
 * @param cssName css文件的后缀名
 * @param subpackagefileDir 需要扫描的几个分包目录
 * @param fileRoot 入口文件夹名称
 * @param needAllFileClass 是否需要提取主包和分包的公共样式
 * @returns {Object} 
 */
const normalizeFiles = async ({fileRoot = '', cssName = 'wxss', subpackagefileDir = [], needAllFileClass = false}) => {
  let files = {}
  let subPackagesDir = []
  let mainDir = []
  let allDir = []
  
  if(fileRoot){
    const data = await fsPromise.readFile(path.resolve(fileRoot, './app.json'), 'utf8')
    const jsonObject = JSON.parse(data)

    jsonObject.subPackages.forEach(subpackage=>{
      subPackagesDir.push(fileRoot + '/' +subpackage.root)
    })

    allDir = fg.sync(`${fileRoot}/**`, { onlyDirectories: true, deep: 1 })

    allDir.forEach(alldir => {
      if(!subPackagesDir.includes(alldir)){
        mainDir.push(alldir)
      }
    })
  }

  if(needAllFileClass && !subpackagefileDir.length){ //扫描所有样式文件
    files = scanFiles(mainDir, subPackagesDir, cssName, fileRoot)
  }else if(needAllFileClass && subpackagefileDir.length){ //扫描部分分包和总目录下所有样式文件
    files = scanFiles(mainDir, subpackagefileDir, cssName, fileRoot)
  }else if(!needAllFileClass && subpackagefileDir.length){ //只需要扫描部分分包 
    files = scanFiles([], subpackagefileDir, cssName)
  }else if(!needAllFileClass && !subpackagefileDir.length){ //扫描全部分包不扫描主包
    files = scanFiles([], subPackagesDir, cssName)
  }
  return new Promise((resolve,reject)=>{
    resolve(files)
  })
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
          importClass:path.join(subpackage,`${commonStyle}`)
        })).process(data).then(function(res){
          fs.writeFile(`${file}`,res.css,()=>{
            if (err) throw err;
            // console.log('The file has been saved!');
          })
          fs.writeFile(path.join(subpackage,`${commonStyle}`),subpackageCommonRoot.toString(),()=>{
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
  return commonClassObj
}

const flattenAndUnique = (classMap, fileRoot) => {
  for(let key in classMap){
    if(key === fileRoot){
      classMap[key] = classMap[key].flat()
    }else{
      classMap[key] = Array.from(new Set(classMap[key].flat()))
    }
  }
  return classMap
}

if(needAllFileClass && !fileRoot){
  shell.echo(chalk.red('如果是需要提取整个文件的公共样式, 需要写扫描文件入口! 如果不需要可以不传 needAllFileClass 参数'))
  shell.exit(1)
}

if(subpackagefileDir && !subpackagefileDir.length && !fileRoot){
  shell.echo(chalk.red('如果是需要提取所有分包的公共样式, 需要写扫描文件入口! 如果提取部分分包的公共样式需要添加 subpackagefileDir 参数'))
  shell.exit(1)
}

if(!cssName){
  cssName = 'wxss'
  shell.echo(chalk.yellow('如果没有传css文件后缀默认文件后缀为wxss'))
}

if(!commonStyle){
  commonStyle = `./commonStyle.${cssName}`
  shell.echo(chalk.yellow('如果没有设定公共样式文件名称，默认为名为commonStyle'))
}

needAllFileClass = needAllFileClass === 'false' ? false : needAllFileClass

normalizeFiles({fileRoot, cssName, subpackagefileDir, needAllFileClass}).then(res=>{
  const {mainfiles, subpackagefiles} = res
  Promise.all([collectClass(mainfiles),collectClass(subpackagefiles)]).then((res)=>{
    const files = Object.assign({},subpackagefiles,mainfiles)
    needAllFileClass && normalizeClass(files,compareClass(flattenAndUnique(Object.assign({},res[0],res[1]), fileRoot)),fileRoot)
  }).then(()=>{
    collectClass(subpackagefiles).then((res)=>{
      normalizeSubpackageClass(subpackagefiles, compareSubpackageClass(res))
    })
  })
})




