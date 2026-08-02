#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upload_1 = require("./upload");
const minimist = require('minimist');
// 获取命令行参数
const program = minimist(process.argv.slice(2));
// console.log(program)
// 查看版本
if (program.version) {
    console.log('1.1.1');
    process.exit();
}
// 帮助
if (program.help) {
    console.log("Usage: aliyunoss-cli [options]");
    console.log("--help               查看帮助");
    console.log("--version            查看版本");
    console.log("--config             配置文件路径 默认: ./alioss.config.json");
    console.log("--releaseEnv         发布环境 例如: dev pre prd");
    console.log("--source             本地静态文件路径 例如: dist/");
    console.log("--target             阿里云 OSS 文件路径 例如: static/home/");
    console.log("--accessKeyId        阿里云 OSS accessKeyId");
    console.log("--accessKeySecret    阿里云 OSS accessKeySecret");
    console.log("--bucket             阿里云 OSS bucket");
    console.log("--region             阿里云 OSS region");
    process.exit();
}
// 获取配置路径
const configPath = upload_1.path.posix.join(process.cwd(), program.config || './alioss.config.json');
// 获取文件配置
const aliossConfig = {};
if (upload_1.fs.existsSync(configPath)) {
    Object.assign(aliossConfig, require(configPath));
}
// 根据环境获取文件路径
if (program.releaseEnv && aliossConfig.releaseEnvConf && aliossConfig.releaseEnvConf[program.releaseEnv]) {
    Object.assign(aliossConfig, aliossConfig.releaseEnvConf[program.releaseEnv]);
}
// 获取命令行配置
if (program.accessKeyId)
    aliossConfig.accessKeyId = program.accessKeyId;
if (program.accessKeySecret)
    aliossConfig.accessKeySecret = program.accessKeySecret;
if (program.bucket)
    aliossConfig.bucket = program.bucket;
if (program.region)
    aliossConfig.region = program.region;
if (program.source)
    aliossConfig.source = program.source;
if (program.target)
    aliossConfig.target = program.target;
// console.log(aliossConfig)
// 验证参数
const verParams = ['region', 'accessKeyId', 'accessKeySecret', 'bucket', 'source', 'target'];
verParams.forEach((k) => {
    if (!(k in aliossConfig)) {
        console.error(`ERROR: 缺少参数 ${k}，使用 --help 命令查看具体措施！`);
        process.exit();
    }
});
// 上传 OSS
(0, upload_1.upload)(aliossConfig);
