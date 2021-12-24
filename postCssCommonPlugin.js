const fg = require('fast-glob');
const fs = require('fs');
const path = require('path')
const postcss = require('postcss');

const commonStyle = '/commonStyle.css'

const example = ['dist/wx/subpackage/subpackage1/','dist/wx/subpackage/subpackage2/']

function normalizeFiles(fileDir=['']){
  fileDir = fileDir.map((path)=>{
    return path + '**/*.wxss'
  })
  files = fg.sync(fileDir);
  const subpackageFiles = {}
  files.map((file)=>{
    if(!subpackageFiles[path.resolve(file,'../../../')]){
      subpackageFiles[path.resolve(file,'../../../')] = []
    }
    if(path.resolve(file).indexOf(path.resolve(file,'../../../')) > -1){
      subpackageFiles[path.resolve(file,'../../../')].push(file)
    }
  })
  return subpackageFiles
}

async function collectClass(subpackageFiles){
  let AllClass = {}
  let promiseArr = []
  for(let subpackage in subpackageFiles){
    AllClass[subpackage]= new Array(subpackageFiles[subpackage].length)
    subpackageFiles[subpackage].forEach((file,index)=>{
      AllClass[subpackage][index]=[]
      promiseArr.push(
        new Promise((resolve,reject)=>{
          fs.readFile(file, (err,data) => {
            if(err) reject(err)
            postcss(postCssCollect({
              classCollection: AllClass[subpackage][index]
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
    AtRule(node) {
      let atRule = node.name + node.params 
      node.nodes.forEach((rule)=>{
        atRule += rule.selector
        rule.nodes.forEach((node)=>{
          atRule += node.prop 
          atRule += node.value
        })
      })
      classCollection.push(atRule)
    }
  }
}

function normalizeClass(subpackageFiles,commonClass){
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
    AtRule(node) {
      let atRule = node.name + node.params 
      // node.nodes.forEach((rule)=>{
      //   atRule += rule.selector
      //   rule.nodes.forEach((node)=>{
      //     atRule += node.prop 
      //     atRule += node.value
      //   })
      // })
      // console.log('commonClass[atRule]',atRule,commonClass[atRule])
      // if(commonClass[atRule]){
      //   commonClass[node.selector] === 1 && subpackageCommonRoot.append(node)
      //   node.parent.removeChild(node)
      //   commonClass[atRule] += 1
      // }
    }
  }
}

const compareClass = (subpackagesArr) => {
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

const normalFiles = normalizeFiles(example)

collectClass(normalFiles).then((res)=>{
  normalizeClass(normalFiles, compareClass(res))
})

