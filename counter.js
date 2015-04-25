/**
 * 数据统计脚本
 */
var fs = require("fs");
var _ = require('underscore');
var bufferData = fs.readFileSync('./BaiDu-mind/React.km');
var data = bufferData.toString('ascii', 0, bufferData.length);
var tree = JSON.parse(data);

/**
 * 统计函数
 * @param tree object
 * @param sort string
 * @param sortBy string
 * @param filter function
 */
function counter(tree,sort,sortBy,filter){
	var storage = {};
	sort = sort || "desc";
	sortBy = sortBy || "used";
	filter = filter || function(){
			return true;
		};
	function getChildHeight(node){
		node.deep = node.deep || 0;
		if(node && node.children && node.children.length > 0){
			node.deep = node.children.length;
			node.children.forEach(function(child){
				node.deep += getChildHeight(child);
			});
		}
		return node.deep;
	}

	(function _crapTree(node,_user){
		if(node && node.data){
			storage[node.data.text] = storage[node.data.text] || {
					name:node.data.text,
					used:0,
					user:[],
					deps:0,
					deep:0
				};
			storage[node.data.text].used++;
			if(_user && _user.name && storage[node.data.text].user.indexOf(_user.name) == -1) {
				storage[node.data.text].user.push(_user.name);
			}
			storage[node.data.text].deps = node.children.length;
			storage[node.data.text].deep = getChildHeight(node);
			if(node.children){
				node.children.forEach(function(_node){
					_crapTree(_node,storage[node.data.text]);
				});
			}
		}
	})(tree);
	return _.sortBy(_.values(storage).filter(filter),function(node){
		return sort == "asc" ? node[sortBy] : -node[sortBy];
	});
}
/**
 * 打印输出统计报告,md格式
 */
function printer(title,tree,sort,sortBy,filter){
	var str = "#"+title+"\n\n\n";
	var collection = counter(tree,sort,sortBy,filter);
	collection.forEach(function(item){
		str += "####模块名称:"+item.name+"\n\n";
		str += "模块被使用次数:"+item.used+"\n\n";
		str += "模块的使用者:";
		item.user.forEach(function(_user,index){
			str += _user + (index != item.user.length - 1 ? ", " : "");
		});
		str += "\n\n";
		str += "模块的子树深度:"+item.deep+"\n\n\n\n\n\n";
	});
	fs.writeFileSync(title.replace(".md","")+".md",str);
}

printer("模块统计--按模块被使用的次数排序",tree);

printer("模块统计--按模块依赖数排序",tree,'desc','deps');

printer("模块统计--按模块子树深度排序",tree,'desc','deep');

printer("React带头，模块统计--按模块被使用的次数排序",tree,null,null,function(item){
	return item.name.indexOf("React") != -1;
});

printer("React带头，模块统计--按模块依赖数排序",tree,'desc','deps',function(item){
	return item.name.indexOf("React") != -1;
});

printer("React带头，模块统计--按模块子树深度排序",tree,'desc','deep',function(item){
	return item.name.indexOf("React") != -1;
});