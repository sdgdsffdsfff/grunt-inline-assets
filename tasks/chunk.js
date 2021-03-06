// chunk.js
// chunk 的作用是配合ssi.js 来完成在线url的抓取和替换，ssi只完成本地文件的抓取和替换 
// chunk.js 一定是依赖 ssi.js 给html注入的私有替换串
var util = require('util');
var fs = require('fs');
var path = require('path');
var pwd = process.cwd();
var isUtf8 = require('./is-utf8');
var iconv = require('iconv-lite');
var http = require('http');
var joinbuffers = require('joinbuffers');

var reg = '--#(assets)(\\s([a-z]+)=[\'"](.+?)[\'"]) --';
var t_reg = '--#assets\\s[a-z]+=[\'"].+?[\'"] --';

// p：绝对路径
// return:结果
function parseOne(chunk,callback){
	var chunk = parseChunk2String(chunk);
	var firstInclude = hasIncludes(chunk);
	if(firstInclude){
		parseFirstIncludes(chunk,function(newchunk){
			parseOne(newchunk,callback);
		});
	} else {
		callback(chunk);
	}
}

function hasIncludes(chunk){
	var content = parseChunk2String(chunk);
	var r = content.match(new RegExp(reg,'i'));
	if(r){
		var f = RegExp.$4;
		return f;
	} else {
		return false;
	}
}

function parseFirstIncludes(content,callback){
	var content = parseChunk2String(content);
	var includefile = hasIncludes(content);

	http.get(('http://'+includefile).replace(/^http:\/\/http:\/\//i,'http://'), function(res) {
		var buffs = [];
		res.on('data',function(chunk){
			buffs.push(chunk);
		}).on('end',function(){
            var buff = joinbuffers(buffs);
			var xcontent = parseChunk2String(buff);
			xcontent = dollerEncode(xcontent);
			var newchunk = content.replace(new RegExp(t_reg,'i'),xcontent);
			newchunk = dollerDecode(newchunk);
			callback(newchunk);
			console.log('Fetch Assets File: '+green('http://'+includefile));
		});
		// console.log("Got response: " + res.statusCode);
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
		callback('socket error');
	});
}

function parseChunk2String(content){
	if(!(content instanceof Buffer)){
		content = new Buffer(content);
	}
	encoding = isUtf8(content)?'utf8':'gbk';
	if(encoding == 'gbk'){
		content = iconv.encode(iconv.decode(content, 'gbk'),'utf8');
	}
	content = content.toString('utf8');
	return content;
}

function consoleColor(str,num){
	if (!num) {
		num = '32';
	}
	return "\033[" + num +"m" + str + "\033[0m";
}

function green(str){
	return consoleColor(str,32);
}
// 
function dollerEncode(content){
	content = content.replace('\'$\'','\'>_doller_<\'','ig');
	content = content.replace('$','>_doller_<','ig');
	content = content.replace('$1','>_doller1_<','ig');
	content = content.replace('$2','>_doller2_<','ig');
	content = content.replace('$3','>_doller3_<','ig');
	content = content.replace('$4','>_doller4_<','ig');
	content = content.replace('$5','>_doller5_<','ig');
	content = content.replace('$6','>_doller6_<','ig');
	content = content.replace('$7','>_doller7_<','ig');
	return content.replace('$','>_doller_<','ig');
}
function dollerDecode(content){
	content = content.replace('\'>_doller_<\'','\'$\'','ig');
	content = content.replace('>_doller_<','$','ig');
	content = content.replace('>_doller1_<','$1','ig');
	content = content.replace('>_doller2_<','$2','ig');
	content = content.replace('>_doller3_<','$3','ig');
	content = content.replace('>_doller4_<','$4','ig');
	content = content.replace('>_doller5_<','$5','ig');
	content = content.replace('>_doller6_<','$6','ig');
	content = content.replace('>_doller7_<','$7','ig');
	return content.replace('>_doller_<','$','igm');
}

exports.parse = parseOne;
