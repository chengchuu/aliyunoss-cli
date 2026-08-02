"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fs = exports.path = exports.alioss = void 0;
exports.upload = upload;
exports.alioss = require('ali-oss');
exports.path = require('path');
exports.fs = require('fs');
let allNumber = 0;
let tmpNumber = 0;
let sucNumber = 0;
let retNumber = 0;
let sizeNumber = 0;
function upload(aliossConfig) {
    const client = new exports.alioss(aliossConfig);
    console.log(`[aliyunoss-cli] START UPLOADING... oss://${aliossConfig.bucket}/${aliossConfig.target}`);
    const list = _list(exports.path.posix.join(process.cwd(), aliossConfig.source));
    allNumber = list.length;
    if (list.length > 0) {
        list.forEach(item => {
            _upload(item, aliossConfig, client);
        });
    }
    else {
        _result();
    }
}
function _result() {
    if (allNumber === tmpNumber) {
        console.log(`[aliyunoss-cli] RESULT :   ${_renderSize(sizeNumber)} - [ SIZE ]   ${allNumber} - [ ALL ]   ${sucNumber} - [ SUCCESS ]   ${retNumber} - [ RETRY ]`);
    }
}
function _upload(item, aliossConfig, client, retry = true) {
    client.put(`${aliossConfig.target}${item.relative}`, item.file).then(() => {
        sucNumber++;
        tmpNumber++;
        sizeNumber += item.size;
        console.log(`[aliyunoss-cli] 【 ${item.file} 】SUCCESS   ✔ 【${_renderSize(item.size)}】`);
        _result();
    }).catch(() => {
        if (retry) {
            _upload(item, aliossConfig, client, false);
        }
        else {
            retNumber++;
            tmpNumber++;
            console.log(`[aliyunoss-cli] 【 ${item.file} 】FAILURE   ✘ `);
            _result();
        }
    });
}
function _list(src) {
    let entrysList = [];
    const fetchFile = (file) => {
        if (!exports.fs.existsSync(file)) {
            return;
        }
        let fileStat = exports.fs.statSync(file);
        if (fileStat.isDirectory()) {
            const fileList = exports.fs.readdirSync(file);
            if (!fileList.length) {
                return;
            }
            fileList.forEach((item) => {
                fetchFile(exports.path.posix.join(file, `./${item}`));
            });
        }
        else {
            entrysList.push({ file, relative: exports.path.posix.relative(src, file), size: fileStat.size });
        }
    };
    fetchFile(src);
    return entrysList;
}
function _renderSize(value) {
    if (null == value || value == '') {
        return "0 Bytes";
    }
    let unitArr = new Array("Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");
    let index = 0;
    let srcsize = parseFloat(value);
    index = Math.floor(Math.log(srcsize) / Math.log(1024));
    let size = srcsize / Math.pow(1024, index);
    size = size.toFixed(2);
    return size + unitArr[index];
}
