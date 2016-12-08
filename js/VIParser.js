/**
 * Created by Fengma on 2016/11/17.
 */

'use strict';
let bd = $('body');
let navigationBar = $('<div id="navigationBar-div"></div>');
let fileImporter = $('<input type="file" id="file-input" onchange="importVI()">');
let startBtn = $('<input type="button" class="navigationBar-btn" style="flex-grow: 1; text-align: right" value="启动" onclick="toggleStart()">');
let importBtn = $('<input type="button" class="navigationBar-btn" value="导入">');
let exportBtn = $('<input type="button" class="navigationBar-btn" value="导出" onclick="exportVI()">');
let resetBtn = $('<input type="button" class="navigationBar-btn" value="重置" onclick="init()">');
let mainContainer = $('<div id="container-div" class="rowFlex-div"></div>');
let sideBar = $('<div id="sideBar" class="draggable-sideBar"></div>');
let VIContainer = $('<div id="VIContainer" class="draggable-div" ondrop="drop(event)" ondragover="allowDrop(event)"></div>');
let contextMenu = $('<div id="menu" class="columnFlex-div"></div>');

VIContainer.click(function () {

    contextMenu.css('display', 'none');
});
importBtn.click(function () { fileImporter.click();});

mainContainer.append(sideBar);
mainContainer.append(VIContainer);
navigationBar.append(startBtn);
navigationBar.append(importBtn);
navigationBar.append(exportBtn);
navigationBar.append(resetBtn);
bd.append(navigationBar);
bd.append(mainContainer);

let instance;
let mainTimer;
let bindInfoArr = [];//记录连接的输入输出VI的ID，以空格隔开
let parsingFlag = false;
let setVIDataIndex = 0;
let dataObject = {};

function init () {

    bindInfoArr = [];
    dataObject = {};
    sideBar.html('');
    VIContainer.html('');
    fileImporter.val('');

    for (let VIName in VILibrary.VI) {

        if (VILibrary.VI.hasOwnProperty(VIName)) {

            addCanvasToSideBar(VIName, getVIcnName(VIName));
        }
    }
    ready();
    containerResize();
}

function checkIfTargetInputValueBound (targetVI, targetInputType) {

    for (let sourceInfo of targetVI.source) {

        if (sourceInfo[1] === targetInputType) {
            return true;
        }

    }
    return false;
}

//向记录数组中添加绑定对
function addBindInfo (bindInfo) {

    if (bindInfoArr.indexOf(bindInfo) === -1) {

        bindInfoArr.push(bindInfo);
    }
}

//从记录数组中删除绑定对
function deleteBindInfo (bindInfo) {

    console.log('bindInfo deleting');
    if (bindInfoArr.indexOf(bindInfo) !== -1) {

        bindInfoArr.splice(bindInfoArr.indexOf(bindInfo), 1);
        console.log('bindInfo deleted');
    }
}

//删除VI
function deleteVI (canvas) {

    let canvasId = canvas.id;
    let VI = getVIById(canvasId);
    //从绑定信息删除VI数据
    // for (let bindInfo of bindInfoArr) {
    //
    //     let reg = new RegExp(canvasId);
    //     console.log(reg.test(bindInfo)+':'+canvasId+':'+bindInfo);
    //     if (reg.test(bindInfo)) {
    //
    //         bindInfoArr.splice(bindInfoArr.indexOf(bindInfo), 1);
    //     }
    // }
    //从数据对象删除VI数据
    if (dataObject[VI.name].indexOf(VI) !== -1) {

        dataObject[VI.name].splice(dataObject[VI.name].indexOf(VI), 1);
        dataObject[VI.name + 'Count'] -= 1;
    }
    //从连线库删除VI数据
    instance.detachAllConnections(canvas);

    instance.deleteEndpoint('output-' + canvasId);
    instance.deleteEndpoint('input-' + canvasId);
    canvas.remove();

    ready();
}

function getVIcnName (VIName) {

    if (VILibrary.VI.hasOwnProperty(VIName)) {

        return VILibrary.VI[VIName].cnName;
    }
    return false;
}

function getVIById (VIId) {

    try {

        let VIInfo = VIId.split('-');
        if (!dataObject[VIInfo[0]]) {

            return false;
        }
        for (let VI of dataObject[VIInfo[0]]) {

            if (VI.container.id === VIId) {

                return VI;
            }
        }
        return false;
    }
    catch (e) {
        return false;
    }
}

function getSourceVIOutput (sourceVI, sourceOutputType) {

    return sourceVI.getData(sourceOutputType);
}

//查找sourceVI的输出参数
function getSourceVIOutputType (sourceVI, targetVI) {

    for (let sourceInfo of sourceVI.target) {

        if (sourceInfo[0] === targetVI) {

            return sourceInfo[1];
        }
    }
    return false;
}

//查找targetVI的输入参数类型
function getTargetVIInputType (targetVI, sourceVI) {

    for (let targetInfo of targetVI.source) {

        if (targetInfo[0] === sourceVI) {

            return targetInfo[1];
        }
    }
    return false;
}

function setTargetVIData (targetVI, sourceData, targetInputType) {

    targetVI.setData(sourceData, targetInputType);

}

function setData () {

    if (setVIDataIndex > 0) {

        return false;
    }

    for (setVIDataIndex = 0; setVIDataIndex < bindInfoArr.length; setVIDataIndex += 1) {

        let sourceVI = getVIById(bindInfoArr[setVIDataIndex].split(' ')[0]);
        let targetVI = getVIById(bindInfoArr[setVIDataIndex].split(' ')[1]);

        let sourceData = getSourceVIOutput(sourceVI, getSourceVIOutputType(sourceVI, targetVI));
        let targetInputType = getTargetVIInputType(targetVI, sourceVI);

        setTargetVIData(targetVI, sourceData, targetInputType);
    }

    setVIDataIndex = 0;
}

//双击VI弹出框
function showBox (VICanvas) {

    let canvasId = VICanvas.id;
    let VI = getVIById(canvasId);

    if (VI.boxTitle) {

        layer.open({
            type: 1,
            title: VI.boxTitle,
            area: ['auto', 'auto'],
            shade: 0.3,
            shadeClose: true,
            closeBtn: false,
            zIndex: layer.zIndex,
            content: VI.boxContent,
            btnAlign: 'c',
            btn: ['确定', '取消'],
            yes: function (index) {
                VI.setInitialData();
                layer.close(index);
            },
            btn2: function (index) {
                layer.close(index);
            },
            success: function (layero) {
                layer.setTop(layero);
            }
        });
    }
}

//控制全局启停
function toggleStart () {

    if (startBtn.val() === '启动') {

        startBtn.val('停止');
        startBtn.css('background-color', '#6dd3d1');
        mainTimer = window.setInterval(function () {
            if (bindInfoArr.length === 0) {

                window.clearInterval(mainTimer);
                return false;
            }
            setData();
        }, 50);
    }
    else {

        startBtn.val('启动');
        startBtn.css('background-color', '');
        window.clearInterval(mainTimer);
    }
}

/**
 *添加节点
 * @param id 元素ID
 * @param outputPointCount 输出节点允许最大连接数
 * @param inputPointCount 输入节点允许最大连接数
 */
function addEndpoints (id, outputPointCount, inputPointCount) {

    // this is the paint style for the connecting lines..
    let connectorPaintStyle = {
            strokeWidth: 2,
            stroke: '#61B7CF',
            joinstyle: 'round',
            outlineStroke: 'white',
            outlineWidth: 2
        },
        // .. and this is the hover style.
        connectorHoverStyle = {
            strokeWidth: 3,
            stroke: '#216477',
            outlineWidth: 5,
            outlineStroke: 'white'
        },
        endpointHoverStyle = {
            fill: '#216477',
            stroke: '#216477'
        },
        // the definition of output endpoints (the small blue ones)
        outputEndpoint = {
            endpoint: 'Dot',
            paintStyle: {
                stroke: '#7AB02C',
                fill: 'transparent',
                radius: 7,
                strokeWidth: 1
            },
            isSource: true,
            maxConnections: outputPointCount, //设置最大连接个数，-1为不限制
            connector: ['Flowchart', {stub: [10, 15], gap: 10, cornerRadius: 5, alwaysRespectStubs: true}],
            connectorStyle: connectorPaintStyle,
            hoverPaintStyle: endpointHoverStyle,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            overlays: [
                ['Label', {
                    location: [0.5, 1.5],
                    label: 'Drag',
                    cssClass: 'endpointSourceLabel',
                    visible: false
                }]
            ]
        },
        // the definition of input endpoints (will appear when the user drags a connection)
        inputEndpoint = {
            endpoint: 'Dot',
            paintStyle: {fill: '#7AB02C', radius: 7},
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: inputPointCount,
            dropOptions: {hoverClass: 'hover', activeClass: 'active'},
            isTarget: true,
            overlays: [
                ['Label', {
                    location: [0.5, -0.5],
                    label: 'Drop',
                    cssClass: 'endpointTargetLabel',
                    visible: false
                }]
            ]
        },
        outputAnchors = [
            [0.2, 0, 0, -1, 0, 0, "foo"],
            [1, 0.2, 1, 0, 0, 0, "bar"],
            [0.8, 1, 0, 1, 0, 0, "baz"],
            [0, 0.8, -1, 0, 0, 0, "qux"]
        ],
        inputAnchors = [
            [0.6, 0, 0, -1],
            [1, 0.6, 1, 0],
            [0.4, 1, 0, 1],
            [0, 0.4, -1, 0]
        ];

    if (outputPointCount !== 0) {

        instance.addEndpoint(id, outputEndpoint, {
            anchor: outputAnchors,
            uuid: 'output-' + id
        });
    }
    if (inputPointCount !== 0) {

        instance.addEndpoint(id, inputEndpoint, {anchor: inputAnchors, uuid: 'input-' + id});
    }
}

function VIDraw (canvas) {

    VIContainer.append(canvas);
    instance.draggable(canvas);
    let VIName = canvas.attr('id').split('-')[0];
    let tempVI = new VILibrary.VI[VIName].createVI(canvas, true);

    if (!dataObject[VIName]) {
        dataObject[VIName] = [];
    }
    dataObject[VIName].push(tempVI);
    addEndpoints(canvas.attr('id'), tempVI.outputPointCount, tempVI.inputPointCount);

    return tempVI;
}

function getNewId (VIName) {

    if (!dataObject[VIName + 'Count']) {

        dataObject[VIName + 'Count'] = 0;
    }
    let VICount = Number(dataObject[VIName + 'Count']);
    let tempId = VIName + '-' + VICount;

    if (dataObject[VIName]) {

        for (let i = 0; i < dataObject[VIName].length; i += 1) {

            if (dataObject[VIName][i].container.id === tempId) {

                tempId = VIName + '-' + (VICount + 1);
            }
        }
    }
    return tempId;
}

function allowDrop (e) {

    e.preventDefault();
}

function drag (e) {

    e.dataTransfer.setData('Text', e.target.id);
}

function drop (e) {

    e.preventDefault();
    let VICanvas = $('#' + e.dataTransfer.getData('Text'));
    let newVICanvas = $('<canvas></canvas>');
    let VIName = VICanvas.attr('id');

    let newId = getNewId(VIName);
    newVICanvas.attr('id', newId);
    newVICanvas.attr('class', VICanvas.attr('class'));
    newVICanvas.attr('width', VILibrary.VI[VIName].defaultWidth);
    newVICanvas.attr('height', VILibrary.VI[VIName].defaultHeight);
    newVICanvas.css('left', (e.offsetX - newVICanvas.width() / 2) + 'px');
    newVICanvas.css('top', (e.offsetY - newVICanvas.height() / 2) + 'px');
    newVICanvas.attr('ondblclick', 'showBox(this)');
    newVICanvas.attr('oncontextmenu', 'showContextMenu(event, this)');

    VIDraw(newVICanvas);
    dataObject[VIName + 'Count']++;
}

function showContextMenu (e, canvas) {

    e = e || window.event;
    e.preventDefault(); //阻止右键默认菜单

    //鼠标点的坐标
    let oX = e.clientX;
    let oY = e.clientY;
    let lockBtn = $('<li class="context-li">锁定</li>');
    let deleteBtn = $('<li class="context-li">删除</li>');
    lockBtn.click(function () { instance.toggleDraggable(canvas); });
    deleteBtn.click(function () { deleteVI(canvas); });
    //菜单出现后的位置
    contextMenu.css('display', 'block');
    contextMenu.css('left', oX);
    contextMenu.css('top', oY);
    contextMenu.html('');
    contextMenu.append(lockBtn);
    contextMenu.append(deleteBtn);
    VIContainer.append(contextMenu);
    return false;
}

function ready () {

    instance = window.jsp = jsPlumb.getInstance({
        // default drag options
        DragOptions: {cursor: 'pointer', zIndex: 2000},
        // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text;
        // in this case it returns the 'labelText' member that we set on each connection in the 'init' method below.
        ConnectionOverlays: [
            ['Arrow', {
                location: 1,
                visible: true,
                width: 11,
                length: 11,
                id: 'ARROW',
                events: {
                    // click: function () {
                    //                            alert('you clicked on the arrow overlay')
                    //点击箭头事件
                    // }
                }
            }]
        ],
        Container: 'VIContainer'
    });

    let basicType = {
        connector: 'StateMachine',
        paintStyle: {stroke: 'red', strokeWidth: 4},
        hoverPaintStyle: {stroke: 'blue'},
        overlays: ['Arrow']
    };

    instance.registerConnectionType('basic', basicType);

    // suspend drawing and initialise.
    instance.batch(function () {

        // 监听连线事件
        instance.bind('connection', function (connectionInfo) {

            if (!parsingFlag) {

                let sourceId = connectionInfo.sourceId;
                let targetId = connectionInfo.targetId;
                let sourceVI = getVIById(sourceId);
                let targetVI = getVIById(targetId);
                let targetInputType = 0;
                let sourceOutputType = 0;

                addBindInfo(sourceId + ' ' + targetId);
                //对多输出控件判断
                if (sourceVI.outputBoxTitle) {

                    layer.open({
                        type: 1,
                        title: sourceVI.outputBoxTitle,
                        area: ['auto', 'auto'],
                        shade: 0.3,
                        shadeClose: false,
                        closeBtn: false,
                        zIndex: layer.zIndex,
                        content: sourceVI.outputBoxContent,
                        btnAlign: 'c',
                        btn: ['确定', '取消'],
                        yes: function (index) {

                            sourceOutputType = Number($('input[name=output-type]:checked').val());
                            if (!sourceOutputType) {

                                layer.msg('未选择' + getVIcnName(sourceVI.name) + '输出参数！',
                                    {icon: 2, shade: 0.6, time: 1500, zIndex: layer.zIndex});
                                return false;
                            }
                            sourceVI.target.push([targetVI, sourceOutputType]);
                            layer.close(index);
                        },
                        btn2: function () {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            layer.msg('未选择' + getVIcnName(sourceVI.name) + '输出参数！',
                                {icon: 2, shade: 0.6, time: 1500}, function () { layer.closeAll(); });
                        },
                        cancel: function () {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            layer.msg('未选择' + getVIcnName(sourceVI.name) + '输出参数！',
                                {icon: 2, shade: 0.6, time: 1500}, function () { layer.closeAll(); });
                        },
                        success: function (layero) {
                            layer.setTop(layero);
                        }
                    });
                }
                else {

                    sourceVI.target.push([targetVI, sourceOutputType]);
                }

                //对于多输入控件,进行输入端口判断
                if (targetVI.inputBoxTitle) {

                    layer.open({
                        type: 1,
                        title: targetVI.inputBoxTitle,
                        area: ['auto', 'auto'],
                        shade: 0.3,
                        shadeClose: false,
                        closeBtn: false,
                        zIndex: layer.zIndex,
                        content: targetVI.inputBoxContent,
                        btnAlign: 'c',
                        btn: ['确定', '取消'],
                        yes: function (index) {

                            let checkedRadio = $('input[name=input-type]:checked');
                            targetInputType = Number(checkedRadio.val());
                            if (!targetInputType) {

                                layer.msg('未选择' + getVIcnName(targetVI.name) + '输入参数！',
                                    {icon: 2, shade: 0.6, time: 1500, zIndex: layer.zIndex});
                                return false;
                            }
                            if (checkIfTargetInputValueBound(targetVI, targetInputType)) {//检测此输入端口是否已与其他VI连接

                                layer.msg(getVIcnName(targetVI.name) + checkedRadio.attr('alt') + '已绑定！',
                                    {icon: 2, shade: 0.6, time: 1500, zIndex: layer.zIndex});
                                return false;
                            }
                            targetVI.source.push([sourceVI, targetInputType]);
                            layer.close(index);
                        },
                        btn2: function () {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            layer.msg('未选择' + getVIcnName(targetVI.name) + '输入参数！',
                                {icon: 2, shade: 0.6, time: 1500}, function () { layer.closeAll(); });
                        },
                        cancel: function () {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            layer.msg('未选择' + getVIcnName(targetVI.name) + '输入参数！',
                                {icon: 2, shade: 0.6, time: 1500}, function () { layer.closeAll(); });
                        },
                        success: function (layero) {
                            layer.setTop(layero);
                        }
                    });
                }
                else {

                    targetVI.source[0] = [sourceVI, targetInputType]; //只有一个输入，所以直接给source[0]赋值
                }
            }
        });

        // 绑定点击删除连线
        instance.bind('click', function (conn) {

            layer.confirm("删除连接?", {icon: 3, title: '提示', closeBtn: false},
                function (index) {

                    instance.detach(conn);
                    layer.close(index);
                }
            )
            ;
        });

        //监听断开连线事件
        instance.bind('connectionDetached', function (connectionInfo) {

            let sourceId = connectionInfo.sourceId;
            let targetId = connectionInfo.targetId;
            let sourceVI = getVIById(sourceId);
            let targetVI = getVIById(targetId);

            if (sourceVI.target) {

                for (let targetInfo of sourceVI.target) {

                    if (targetInfo[0] === targetVI) {

                        sourceVI.target.splice(sourceVI.target.indexOf(targetInfo), 1);
                        break;
                    }
                }
            }
            if (targetVI.source) {

                for (let sourceInfo of targetVI.source) {

                    if (sourceInfo[0] === sourceVI) {

                        targetVI.source.splice(targetVI.source.indexOf(sourceInfo), 1);
                        break;
                    }
                }
            }
            deleteBindInfo(sourceId + ' ' + targetId);
            console.log('Connection detached');
        });
    });

    jsPlumb.fire('jsPlumbDemoLoaded', instance);

}

function containerResize () {

    let height = window.innerHeight * 0.95 > 600 ? window.innerHeight * 0.95 : 600;
    sideBar.css('height', height);
    VIContainer.css('height', height);
}

function addCanvasToSideBar (id, name) {

    let VISpan = $('<span></span>');
    VISpan.attr('id', id);
    VISpan.attr('class', 'draggable-element');
    VISpan.css('width', '130px');
    VISpan.css('height', 'auto');
    VISpan.css('display', 'inline-block');
    VISpan.attr('draggable', 'true');
    VISpan.attr('ondragstart', 'drag(event)');
    VISpan.text(name);
    sideBar.append(VISpan);
    return VISpan;

}

window.addEventListener('resize', containerResize, false);

function createCanvas (id, className, width, height, top, left) {

    let canvas = $('<canvas></canvas>');
    canvas.attr('id', id);
    canvas.attr('class', className);
    canvas.attr('width', width);
    canvas.attr('height', height);
    canvas.css('top', top);
    canvas.css('left', left);
    canvas.attr('oncontextmenu', 'showContextMenu(event, this)');
    canvas.attr('ondblclick', 'showBox(this)');

    return canvas;
}

function parseImportVIInfo (json) {

    parsingFlag = true;//导入解析时无需弹出输入输出选择
    for (let bindInfo of json.VIInfo) {

        try {
            let sourceInfo = bindInfo.sourceInfo;
            let targetInfo = bindInfo.targetInfo;
            let sourceVI = getVIById(sourceInfo.id);
            let targetVI = getVIById(targetInfo.id);
            if (!sourceVI) {

                let sourceVIName = sourceInfo.id.split('-')[0];
                let sourceCanvas = createCanvas(sourceInfo.id, sourceInfo.className, sourceInfo.width, sourceInfo.height, sourceInfo.top, sourceInfo.left);

                sourceVI = VIDraw(sourceCanvas);
                if (!dataObject[sourceVIName + 'Count']) {

                    dataObject[sourceVIName + 'Count'] = 0;
                }
                dataObject[sourceVIName + 'Count']++;
            }
            if (!targetVI) {

                let targetVIName = targetInfo.id.split('-')[0];
                let targetCanvas = createCanvas(targetInfo.id, targetInfo.className, targetInfo.width, targetInfo.height, targetInfo.top, targetInfo.left);

                targetVI = VIDraw(targetCanvas);
                if (!dataObject[targetVIName + 'Count']) {

                    dataObject[targetVIName + 'Count'] = 0;
                }
                dataObject[targetVIName + 'Count']++;
            }

            sourceVI.target.push([targetVI, sourceInfo.outputType]);
            targetVI.source.push([sourceVI, targetInfo.inputType]);
            addBindInfo(sourceInfo.id + ' ' + targetInfo.id);
            instance.connect({
                source: instance.getEndpoint('output-' + sourceInfo.id),
                target: instance.getEndpoint('input-' + targetInfo.id)
            });
        }
        catch (e) {

            init();
            console.log('Parse ImportVI ' + e);
            parsingFlag = false;
            return false;
        }
    }
    parsingFlag = false;
    fileImporter.val('');
}

function exportVI () {

    if (bindInfoArr.length === 0) {

        alert('No VI connected!');
        return false;
    }
    let exportInfo = {VIInfo: []};
    for (let info of bindInfoArr) {

        let sourceInfo = {};
        let targetInfo = {};
        let sourceVIId = info.split(' ')[0];
        let targetVIId = info.split(' ')[1];
        let sourceVI = getVIById(sourceVIId);
        let targetVI = getVIById(targetVIId);
        let sourceCanvas = $('#' + sourceVIId);
        let targetCanvas = $('#' + targetVIId);

        sourceInfo.id = sourceVIId;
        sourceInfo.outputType = getSourceVIOutputType(sourceVI, targetVI);
        sourceInfo.className = sourceCanvas.attr('class');
        sourceInfo.width = sourceCanvas.width();
        sourceInfo.height = sourceCanvas.height();
        sourceInfo.top = sourceCanvas.css('top');
        sourceInfo.left = sourceCanvas.css('left');

        targetInfo.id = targetVIId;
        targetInfo.inputType = getTargetVIInputType(targetVI, sourceVI);
        targetInfo.className = targetCanvas.attr('class');
        targetInfo.width = targetCanvas.width();
        targetInfo.height = targetCanvas.height();
        targetInfo.top = targetCanvas.css('top');
        targetInfo.left = targetCanvas.css('left');

        exportInfo.VIInfo.push({sourceInfo: sourceInfo, targetInfo: targetInfo});
    }

    let json = JSON.stringify(exportInfo);

    let pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
    pom.setAttribute('download', 'exportVI.txt');

    if (document.createEvent) {
        let event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

function importVI () {

    if (startBtn.val() === '停止') {

        startBtn.val('启动');
        startBtn.css('background-color', '');
        window.clearInterval(mainTimer);
    }
    let selectedFile = fileImporter[0].files[0];

    let reader = new FileReader();
    reader.readAsText(selectedFile);
    reader.onload = function () {

        //先初始化数据记录
        VIContainer.html('');
        ready();
        bindInfoArr = [];
        dataObject = {};
        parseImportVIInfo($.parseJSON(this.result));
    }
}

init();
