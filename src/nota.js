(function(window,undefined){
    const Nota = {};
    Nota.name = 'NotaJS';
    Nota.NotaJS = 'NotaJS';
    Nota.version = '0.0.2';
    Nota.compatibleVersions = ['0.0.1','0.0.2'];
    Nota.NotaJSCompatible = true;
    Nota.versionCode = 'Favonius';
    Nota.fuckCode = 'HJD';

    Nota.__extract = {};
    Nota.__root = 'Nota ROOT';
    Nota.unsafe = {};
    Nota.experimental = {};

    function $Q(query,return_arr=false){
        let r = document.querySelectorAll(query);
        if(r.length == 1 && !return_arr){
            return r[0];
        } else {
            return r;
        }
    }

    /**
     * 
     * @param { string } tagname 
     * @param { string } h_id 
     * @param { [string] } h_class 
     * @param { Map } h_attr
     */
    function $C(tagname='div',h_id='',h_class=[],h_attr=undefined){
        const c = document.createElement(tagname);
        if(h_id!='') c.id = h_id;
        if(h_class!=[]) c.classList.add(...h_class);
        if(h_attr)
            for(let [k,v] of h_attr){
                c.setAttribute(k,v);
            }
        return c;
    }

    Nota.Q = Nota.__extract.Q = $Q;
    Nota.C = Nota.__extract.C = $C;
    Nota.O = Nota.__extract.O = console.log;

    Nota.unsafe.extract = function(){
        for(let k in Nota.__extract){
            window[k] = Nota.__extract[k];
        }
    }

    function JStringify(json,option={},space=4,f=1,chain=[]){
        if(typeof json == 'function'){
            return 'ES Function';
        }
        if(typeof json != 'object'){
            return json;
        }
        if(chain.includes(json)) return 'detected ref loop';
        chain.push(json);
        let crlf = '\n',quo = '',eqsym=' : ';
        let hidden = [], omitted = [],show_type=false;
        if(option.crlf)(crlf = option.crlf);
        if(option.quo)(quo = option.quo);
        if(option.eqsym)(eqsym = option.eqsym);
        if(option.hidden)(hidden = option.hidden);
        if(option.omitted)(omitted = option.omitted);
        if(option.show_type)(show_type = option.show_type);
        let r = '{'+crlf;
        for(let k in json){
            if(omitted.includes(k)) continue;
            r+=' '.repeat(space*f)+quo+k+quo+eqsym;
            if(hidden.includes(k)){
                r+='...';
            }
            else if(typeof json[k] == 'function'){
                r+='ES Function';
            }else if(typeof json[k] == 'boolean'){
                if(show_type) r+='Boolean';
                else r+=json[k];
            }else if(typeof json[k] != 'object'){
                if(show_type) r+='Text';
                else r+=quo+json[k]+quo;
            }else{
                if(json[k] instanceof Array){
                    if(show_type) r+='ES Array';
                    else {
                        r+='['+crlf;
                        for(let v of json[k]){
                            console.log(v);
                            r+=' '.repeat(space*(f+1))+JStringify(v,option,space,f)+','+crlf;
                        }
                        r+=' '.repeat(space*f)+']';
                    }
                }
                else{
                    r+=JStringify(json[k],option,space,f+1,chain);
                }
            }
            r+=crlf;
        }
        r += ' '.repeat(space*(f-1))+'}';
        return r;
    }

    Nota.experimental.JStringify = JStringify;

    class NStyleSheetManager{
        #style;
        #on_element;
        #mounted;
        /**
         * 
         * @param { {} } style 
         */
        constructor(style){
            this.#style = style;
            this.#mounted = false;
        }
        setStyle(k,v){
            this.#style[k]=v;
            if(this.#mounted)
                this.#on_element.style[k]=v;
        }
        removeStyle(k){
            this.#style[k]=undefined;
            if(this.#mounted)
                this.#on_element.style[k]='unset';
        }
        getStyleJSON(){
            return JSON.stringify(this.#style);
        }
        mount(element){
            this.#on_element = element;
            for(let k in this.#style){
                this.#on_element.style[k] = this.#style[k];
            }
            this.#mounted = true;
        }
        umount(){
            if(!this.#mounted) return 'failed [NoMountOperationBefore]';
            for(let k in this.#style){
                this.#on_element.style[k] = 'unset';
            }
            this.#on_element = void 0;
            this.#mounted = false;
        }
    }
    
    class NEventQueueManager{
        #event_queues;
        #on_element;
        #mounted;
        #function;
        /**
         * 
         * @param { {} } event_queues 
         */
        constructor(event_queues){
            this.#event_queues = event_queues;
            this.#mounted = false;
            this.#function = {};
        }
        addEvent(name,e){
            this.#event_queues[name].push(e);
            return this.#event_queues[name].length -1;
        }
        popEvent(name){
            return this.#event_queues[name].pop();
        }
        removeEvent(name,index){
            return this.#event_queues[name].splice(index,1);
        }
        mount(element){
            this.#on_element = element;
            for(let eq in this.#event_queues){
                let events = this.#event_queues[eq];
                this.#function[eq] = function(e){
                    const el = element;
                    for(let fn of events){
                        fn(el,e);
                    }
                }
                this.#on_element.addEventListener(eq,this.#function[eq]);
            }
            this.#mounted = true;
        }
        umount(){
            if(!this.#mounted) return 'failed [NoMountOperationBefore]';
            for(let eq in this.#event_queues){
                this.#on_element.removeEventListener(eq,this.#function[eq]);
            }
            this.#on_element = void 0;
            this.#mounted = false;
        }
    }

    class NDOMElementController {
        #root_element;
        #target_element;
        #eq_manager;
        #style_manager;
        /**
         * 
         * @param { HTMLElement } element 
         * @param { NEventQueueManager } eq_manager
         * @param { NStyleSheetManager } ss_manager
         */
        constructor(element,eq_manager=undefined,ss_manager=undefined){
            this.#root_element = element;
            this.#eq_manager = eq_manager;
            this.#style_manager = ss_manager;
        }
        getElement(){
            return this.#root_element;
        }
        setEQManager(eq_manager){
            this.#eq_manager = eq_manager;
        }
        getEQManager(){
            return this.#eq_manager;
        }
        setSSManager(ss_manager){
            this.#style_manager = ss_manager;
        }
        getSSManager(){
            return this.#style_manager;
        }
        mountEvent(){
            if(!this.#eq_manager) return 'failed [NoEQM]';
            this.#eq_manager.mount(this.#root_element);
        }
        umountEvent(){
            if(!this.#eq_manager) return 'failed [NoEQM]';
            this.#eq_manager.umount();
        }
        mountStyle(){
            if(!this.#style_manager) return 'failed [NoSSM]';
            return this.#style_manager.mount(this.#root_element);
        }
        umountStyle(){
            if(!this.#style_manager) return 'failed [NoSSM]';
            return this.#style_manager.umount();
        }
        mount(target_element,opt={e:false,s:false}){
            this.#target_element = target_element;
            this.#target_element.appendChild(this.#root_element);
            if(opt.s) this.mountStyle();
            if(opt.e) this.mountEvent();
        }
        umount(opt={e:false,s:false}){
            if(opt.e) this.umountEvent();
            if(opt.s) this.umountStyle();
            this.#target_element.removeChild(this.#root_element);
            this.#target_element = void 0;
        }
    }

    Nota.Native = {
        NEventQueueManager,
        NStyleSheetManager,
        NDOMElementController,
    };

    Nota.EQManager = NEventQueueManager;
    Nota.SSManager = NStyleSheetManager;
    Nota.DEController = NDOMElementController;

    window.Nota = Nota;
})(window);