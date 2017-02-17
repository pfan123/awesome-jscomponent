/*author:pingfan ,date:2014-12-04
*按需加载库，本库是顺序加载，不涉及并行加载  
*主体方法LoadQueue，接收参数opt，对应两个属性manifest加载资源，version版本号, path路径前缀
*/
 
;(function(window,undefined){

    //封装绑定事件机制
    var EventUtil={
        addHandler:function(element,type,handler){
                if(element.addEventListener){
                        element.addEventListener(type,handler,false);
                }else if(element.attachEvent){
                        element.attachEvent("on"+type,handler);
                }else{
                        element["on"+type]=handler;
                }
        },
        removeHandler:function(element,type,handler){
                if(element.removeEventListener){
                        element.removeEventListener(type,handler,false);
                }else if(element.detachEvent){
                        element.detachEvent('on'+type,handler);
                }else{
                        element["on"+type]=null;
                }
        }
    }
        
    function LoadList(opt){
        this.list = opt.manifest || [],
        this.version = opt.version,
        this.path = opt.path || "",
        this.loadsuccess=false,
        this.done();
    }

    LoadList.prototype={
        constructor:LoadList,
        isType:function(src){
            var resImg=/.*\.jpg|jpeg|png|gif|bmp(?=\?|$)/i,
                resJs=/.*\.js(?=\?|$)/i,
                resCss=/.*\.css(?=\?|$)/i,
                resSound=/.*\.mp3|m4a|ogg|wav|wma(?=\?|$)/i;
            if(resImg.test(src)) return "img";  
            if(resJs.test(src)) return "js";    
            if(resCss.test(src)) return "css";  
            if(resSound.test(src)) return "audio";  
        },
        loadCssJS:function(type,src,callback){
            var source,_this=this;
            if (type == "css"){
                source = document.createElement("link");
                source.setAttribute("rel","stylesheet")
                source.setAttribute("type","text/css");
            }else if(type == "js"){
                source = document.createElement('script');
                source.setAttribute("type","text/javascript");
            }
            if (source.readyState){  //IE
                EventUtil.addHandler(source,"readystatechange",function(){
                    if (source.readyState == "loaded" || source.readyState == "complete"){
                        source.onreadystatechange = null;
                        callback && callback.call(_this);
                    }
                });
                EventUtil.addHandler(source,"error",function(){
                     callback && callback.call(_this);
                });
            } else {  //Others
                EventUtil.addHandler(source,"load",function(){
                     callback && callback.call(_this);
                });
                EventUtil.addHandler(source,"error",function(){
                     callback && callback.call(_this);
                });
            }

            //追加节点到头部
            (type == "css") && (source.setAttribute("href", src));
            (type == "js") && (source.setAttribute("src", src));            
            document.getElementsByTagName('head')[0].appendChild(source);                       
        },
        getResult:function(id){
            if(!this.loadsuccess) return null; 
            for(var i=0,len=this.list.length;i<len;i++){
                if(this.list[i].id == id){
                    var returnSrc=this.list[i].src;
                    if(this.isType(returnSrc) == "img"){
                        return this.list[i].imgObject;
                    }else if(this.isType(returnSrc) == "audio"){
                        var audio = new Audio();
                        audio.src=returnSrc;
                        return audio;
                    }else{
                        alert("此类型没有返回资源操作");
                    }
                }
            }
        },

        /*加载执行函数*/
        done:function(){
            if(!this.list.length) return false;
            var _this=this,
                len=this.list.length,
                count = 0; //加载计时器
            this.precent = "0%";
            for(var i = 0;i<len;i++){
                var src=_this.path+_this.list[i].src;
                (_this.version) && (src=src+"?ver="+_this.version);

                //图片资源加载
                if(_this.isType(src) == "img"){
                    var img=new Image();
                    _this.list[i].imgObject = img;
                    EventUtil.addHandler(img,"load",function(){
                        //加载一次执行一次

                        callNext();
                    });
                    EventUtil.addHandler(img,"error",function(){
                        _this.list[i].imgObject = ''
                        callNext();
                    });
                    img.src=src;
                }

                //音频资源加载
                if(_this.isType(src) == "audio"){
                    var audio=new Audio();
                    EventUtil.addHandler(audio,"canplaythrough",function(){
                        callNext();
                    });
                    EventUtil.addHandler(audio,"error",function(){
                        callNext();
                    });
                    audio.src=src;
                }

                //脚本资源加载
                if(_this.isType(src) == "js"){
                    _this.loadCssJS("js",src,callNext)
                }

                //样式资源加载
                if(_this.isType(src) == "css"){
                    _this.loadCssJS("css",src,callNext)
                }                                               
            };
            function callNext(){                    
                if(count<len-1){
                    count++;
                    _this.precent = Math.ceil((count/len)*100)+"%"; 
                    _this.LoadEndCall && _this.LoadEndCall.call(_this,_this.precent);
                }else{
                    _this.precent = "100%";
                    _this.LoadEndCall && _this.LoadEndCall.call(_this,_this.precent);
                    _this.loadsuccess=true;
                    _this.LoadSuccessCall && _this.LoadSuccessCall.call(_this);
                }
            }
        },
        LoadEnd:function(callback){
            if(!callback)return;
            this.LoadEndCall = callback;
            return this;
        },
        LoadSuccess:function(callback){
            if(!callback)return;
            this.LoadSuccessCall = callback;
            return this;
        }
    };

    window.LoadList=LoadList;
})(window)