const { getAST,getDependencies,transform } = require('./parser')
const path = require('path')
const fs = require('fs')

module.exports = class Compiler{

  // 接收通过lib/index.js new Compiler(options)传递的参数，对应的是forestpack.config.js的配置
  constructor(options){
    const { entry,output } = options || {}
    this.entry = entry
    this.output = output
    this.modules = []
  }

  /**
   * 开启编译，作用：
   * 1. 构建模块
   * 2. 收集依赖
   * 3. 输出文件
   */
  run(){

    const entryModule = this.buildModule(this.entry,true)
    this.modules.push(entryModule)

    this.modules.map(_module=>{
      _module.dependencies.map(dependency=>{
        this.modules.push(this.buildModule(dependency))
      })

    })

    this.emitFiles()
  }

  /**
   * 构建模块，由run调用
   */
  buildModule(filename,isEntry){
    console.log('构建模块 :',isEntry,filename)
    let ast
    if(isEntry){
      ast = getAST(filename)
    }else{
      const absolutePath = path.join(process.cwd(),'./src',filename)
      ast = getAST(absolutePath)
    }

    return {
      filename,
      dependencies: getDependencies(ast),
      transformCode: transform(ast)
    }

  }

  /**
   * 输出文件
   */
  emitFiles(){
    const outputPath = path.join(this.output.path,this.output.filename)
    let modules = ''
    this.modules.map(_module=>{
      console.log('输出文件:',_module.filename)
      modules += `'${_module.filename}' : function(require,module,exports){ ${ _module.transformCode } },`
    })

    const bundle = `
      (function(modules){
        function require(filename){
          const fn = modules[filename];
          const module = { exports:{} };
          fn(require,module,module.exports)
          return module.exports
        }
        require('${this.entry}')
      })({${modules}})
    `;

    fs.writeFileSync(outputPath,bundle,'utf-8')
  }
}
