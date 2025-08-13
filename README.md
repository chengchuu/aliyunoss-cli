# Aliyunoss CLI

[![NPM version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/aliyunoss-cli
[npm-url]: https://npmjs.org/package/aliyunoss-cli
[l-image]: https://img.shields.io/npm/l/aliyunoss-cli
[l-url]: https://github.com/chengchuu/aliyunoss-cli

阿里云 OSS 文件上传 CLI。

## Install

You can get aliyunoss-cli via [npm](http://npmjs.com).

```bash
npm install aliyunoss-cli --save-dev
```

## Usage

创建配置文件 `alioss.config.json`：

```json
{
  "region": "-",
  "accessKeyId": "-",
  "accessKeySecret": "-",
  "bucket": "-",
  "releaseEnvConf": {
    "dev": {
      "source": "dist/",
      "target": "home/dev/"
    },
    "pre": {
      "source": "dist/",
      "target": "home/pre/"
    },
    "prd": {
      "source": "dist/",
      "target": "home/prd/"
    }
  }
}
```

运行：

```bash
# 测试
npx aliyunoss-cli --releaseEnv dev
# 预发布
npx aliyunoss-cli --releaseEnv pre
# 生产
npx aliyunoss-cli --releaseEnv prd
```

更多命令 `npx aliyunoss-cli --help`：

```plain
Usage: aliyunoss-cli [options]
--help               查看帮助
--version            查看版本
--config             配置文件路径 默认: ./alioss.config.json
--releaseEnv         发布环境 例如: dev pre prd
--source             本地静态文件路径 例如: dist/
--target             阿里云 OSS 文件路径 例如: static/home/
--accessKeyId        阿里云 OSS accessKeyId
--accessKeySecret    阿里云 OSS accessKeySecret
--bucket             阿里云 OSS bucket
--region             阿里云 OSS region
```

## thx

[Jeremy Liang](https://github.com/whoopschat)
