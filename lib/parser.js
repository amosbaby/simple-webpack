const fs = require('fs')
const parser = require('@babel/parser') // 将源码生成AST
const traverse = require('@babel/traverse').default // 将AST节点进行递归遍历
const { transformFromAst } = require('babel-core') // 将获得ES6的AST转换成ES5 

module.exports = {
  /**
   * 解析代码生成AST树
   */
  getAST(path){
    // 读取文件
    const source = fs.readFileSync(path,'utf-8')

    return parser.parse(source,{
      sourceType: 'module' // 表示我们解析的是ES模块
    })
  },
  /**
   * 对AST节点进行递归遍历
   */
  getDependencies(ast){
    const dependencies = []

    traverse(ast,{
      ImportDeclaration:({node})=>{
        dependencies.push(node.source.value)
      }
    })

    return dependencies
  },
  /**
   * 将ES6的AST转化成ES5
   */
  transform(ast){
    const {code} = transformFromAst(ast,null,{
      presets:['env']
    })
    return code
  }

}
