/**
 * Created by Fengma on 2016/11/17.
 */

'use strict';
let bd = $('body');
let navigationBar = $('<div id="navigationBar-div"></div>');
let fileImporter = $('<input type="file" id="file-input" accept="text/plain;" onchange="importVI()">');
let importBtn = $('<input type="button" class="navigationBar-btn" value="导入">');
let exportBtn = $('<input type="button" class="navigationBar-btn" value="导出" onclick="exportVI()">');
let resetBtn = $('<input type="button" class="navigationBar-btn" value="重置" onclick="init()">');
let mainContainer = $('<div id="container-div" class="rowFlex-div"></div>');
let sideBar = $('<div id="sideBar" class="draggable-sideBar"></div>');
let VIContainer = $('<div id="VIContainer" class="draggable-div" ondrop="drop(event)" ondragover="allowDrop(event)"></div>');
let contextMenu = $('<div id="contextMenu" class="columnFlex-div"></div>');

VIContainer.click(function () { contextMenu.css('display', 'none');});
importBtn.click(function () { fileImporter.click();});

mainContainer.append(sideBar);
mainContainer.append(VIContainer);
navigationBar.append(importBtn);
navigationBar.append(exportBtn);
navigationBar.append(resetBtn);
bd.append(navigationBar);
bd.append(mainContainer);

let instance;
let parsingFlag = false;

function init () {

    sideBar.html('');
    VIContainer.html('');
    fileImporter.val('');

    //object对象用for in 循环获取key值
    for (let VIName in VILibrary.VI) {

        if (VILibrary.VI.hasOwnProperty(VIName)) {

            addCanvasToSideBar(VIName, VILibrary.InnerObjects.getVIcnName(VIName));
        }
    }
    ready();
    containerResize();
}

function checkIfTargetInputValueBound (targetVI, inputType) {

    for (let sourceInfo of targetVI.sourceInfoArray) {

        if (sourceInfo[2] === inputType) {

            return true;
        }

    }
    return false;
}

function deleteVI (canvas) {

    let canvasId = canvas.id;
    let VI = VILibrary.InnerObjects.getVIById(canvasId);

    // 从连线库删除VI数据
    // instance.detachAllConnections(canvas);
    // instance.deleteEndpoint('output-' + canvasId);
    // instance.deleteEndpoint('input-' + canvasId);

    instance.remove(canvas);
    VI.destroy();
    ready();
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
            stroke: '#6dd3d1',
            outlineWidth: 5,
            outlineStroke: 'white'
        },
        endpointHoverStyle = {
            fill: '#6dd3d1',
            stroke: '#6dd3d1'
        },
        // the definition of output endpoints (the small blue ones)
        outputEndpoint = {
            endpoint: 'Dot',
            paintStyle: {
                stroke: '#00a0e3',
                fill: 'transparent',
                radius: 8,
                strokeWidth: 2
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
            paintStyle: {fill: '#00a0e3', radius: 8},
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

    if (outputPointCount) {

        instance.addEndpoint(id, outputEndpoint, {anchor: outputAnchors, uuid: 'output-' + id});
    }
    if (inputPointCount) {

        instance.addEndpoint(id, inputEndpoint, {anchor: inputAnchors, uuid: 'input-' + id});
    }
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
    contextMenu.empty();
    contextMenu.append(lockBtn);
    contextMenu.append(deleteBtn);
    VIContainer.append(contextMenu);
    return false;
}

function VIDraw (canvas) {

    VIContainer.append(canvas);
    instance.draggable(canvas);
    let VIName = canvas.attr('id').split('-')[0];
    let tempVI = new VILibrary.VI[VIName](canvas, true);
    addEndpoints(tempVI.id, tempVI.outputPointCount, tempVI.inputPointCount);
    return tempVI;
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

    let newId = VIName + '-' + VILibrary.VI[VIName].logCount;
    newVICanvas.attr('id', newId);
    newVICanvas.attr('class', VICanvas.attr('class'));
    newVICanvas.attr('width', VILibrary.VI[VIName].defaultWidth);
    newVICanvas.attr('height', VILibrary.VI[VIName].defaultHeight);
    newVICanvas.css('left', (e.offsetX - newVICanvas.width() / 2) + 'px');
    newVICanvas.css('top', (e.offsetY - newVICanvas.height() / 2) + 'px');
    newVICanvas.attr('oncontextmenu', 'showContextMenu(event, this)');

    VIDraw(newVICanvas);
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
        hoverPaintStyle: {stroke: '#00a0e3'},
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
                let sourceVI = VILibrary.InnerObjects.getVIById(sourceId);
                let targetVI = VILibrary.InnerObjects.getVIById(targetId);
                let targetInputType = 0;
                let sourceOutputType = 0;

                new Promise(function (resolve, reject) {

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

                                    layer.msg('未选择' + VILibrary.InnerObjects.getVIcnName(sourceVI.name) + '输出参数！',
                                        {icon: 2, shade: 0.6, time: 1500, zIndex: layer.zIndex});
                                    return false;
                                }
                                resolve();
                                layer.close(index);
                            },
                            btn2: function (index) {

                                layer.close(index);
                                reject();
                            },
                            success: function (layer0) {

                                layer.setTop(layer0);
                            }
                        });
                    }
                    else {

                        resolve();
                    }
                })
                .then(function () {

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

                                    layer.msg('未选择' + VILibrary.InnerObjects.getVIcnName(targetVI.name) + '输入参数！',
                                        {icon: 2, shade: 0.6, time: 1500, zIndex: layer.zIndex});
                                    return false;
                                }
                                if (checkIfTargetInputValueBound(targetVI, targetInputType)) {//检测此输入端口是否已与其他VI连接

                                    layer.msg(VILibrary.InnerObjects.getVIcnName(targetVI.name) + checkedRadio.attr('alt') + '已绑定！',
                                        {icon: 2, shade: 0.6, time: 1500, zIndex: layer.zIndex});
                                    return false;
                                }
                                VILibrary.InnerObjects.bindDataLine(sourceId, targetId, sourceOutputType, targetInputType);
                                layer.close(index);
                            },
                            btn2: function (index) {

                                layer.close(index);
                                if (connectionInfo) {

                                    instance.detach(connectionInfo.connection);
                                    connectionInfo = null;
                                }
                                layer.msg('未选择' + VILibrary.InnerObjects.getVIcnName(targetVI.name) + '输入参数！', {
                                    icon: 2,
                                    shade: 0.6,
                                    time: 1500
                                });
                            },
                            success: function (layer1) {

                                layer.setTop(layer1);
                            }
                        });
                    }
                    else {
                        VILibrary.InnerObjects.bindDataLine(sourceId, targetId, sourceOutputType, targetInputType);
                    }
                })
                .catch(function () {

                    if (connectionInfo) {

                        instance.detach(connectionInfo.connection);
                        connectionInfo = null;
                    }
                    layer.msg('未选择' + VILibrary.InnerObjects.getVIcnName(sourceVI.name) + '输出参数！', {
                        icon: 2,
                        shade: 0.6,
                        time: 1500
                    });
                });
            }
        });

        // 绑定点击删除连线
        instance.bind('click', function (conn) {

            layer.confirm("删除连接?", {icon: 3, title: '提示', closeBtn: false},
                function (index) {

                    instance.detach(conn);
                    layer.close(index);
                }
            );
        });

        //监听断开连线事件
        instance.bind('connectionDetached', function (connectionInfo) {

            let sourceId = connectionInfo.sourceId;
            let targetId = connectionInfo.targetId;

            VILibrary.InnerObjects.unbindDataLine(sourceId, targetId);
            console.log('Connection detached');
        });
    });

    jsPlumb.fire('jsPlumbDemoLoaded', instance);
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
    for (let importVIInfo of json.VIInfo) {

        try {

            let importVI = VIDraw(createCanvas(importVIInfo.id, importVIInfo.className, importVIInfo.width, importVIInfo.height, importVIInfo.top, importVIInfo.left));

            if (importVIInfo.sourceInfoArray) {

                importVI.sourceInfoArray = importVIInfo.sourceInfoArray;
            }
            if (importVIInfo.targetInfoArray) {

                importVI.targetInfoArray = importVIInfo.targetInfoArray;
            }
            importVI.dataLine = importVIInfo.dataLine;
            if (VILibrary.InnerObjects.dataLineArray.indexOf(importVI.dataLine) === -1) {

                VILibrary.InnerObjects.dataLineArray.push(importVI.dataLine);
            }
        }
        catch (e) {

            init();
            console.log('Parse ImportVI Error:' + e);
            parsingFlag = false;
            return false;
        }
    }
    for (let VI of VILibrary.InnerObjects.existingVIArray) {

        if (VI.sourceInfoArray) {

            if (VI.sourceInfoArray.length > 0) {

                for (let sourceInfo of VI.sourceInfoArray) {

                    instance.connect({
                        source: instance.getEndpoint('output-' + sourceInfo[0]),
                        target: instance.getEndpoint('input-' + VI.id)
                    });
                }
            }
        }
    }
    parsingFlag = false;//解析完毕取消连线弹框锁定
    fileImporter.val('');
}

function exportVI () {

    layer.prompt({
        formType: 0,
        value: 'exportVI.txt',
        title: '请输入导出文件名',
        shadeClose: true,
        closeBtn: false
    }, function (value, index) {

        let exportJSON = {VIInfo: []};
        for (let VI of VILibrary.InnerObjects.existingVIArray) {

            let exportVIInfo = {};
            let sourceCanvas = $(VI.container);//转换为jQuery方便取属性值

            exportVIInfo.id = VI.id;
            if (VI.sourceInfoArray) {

                if (VI.sourceInfoArray.length > 0) {

                    exportVIInfo.sourceInfoArray = VI.sourceInfoArray;
                }
            }
            if (VI.targetInfoArray) {

                if (VI.targetInfoArray.length > 0) {

                    exportVIInfo.targetInfoArray = VI.targetInfoArray;
                }
            }
            exportVIInfo.dataLine = VI.dataLine;
            exportVIInfo.className = sourceCanvas.attr('class');
            exportVIInfo.width = sourceCanvas.width();
            exportVIInfo.height = sourceCanvas.height();
            exportVIInfo.top = sourceCanvas.css('top');
            exportVIInfo.left = sourceCanvas.css('left');

            exportJSON.VIInfo.push(exportVIInfo);
        }

        let JSONString = JSON.stringify(exportJSON);

        let pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSONString));
        pom.setAttribute('download', value);

        if (document.createEvent) {

            let event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {

            pom.click();
        }
        layer.close(index);
    });

}

function importVI () {

    let selectedFile = fileImporter[0].files[0];

    let reader = new FileReader();
    reader.readAsText(selectedFile);
    reader.onload = function () {

        //先初始化数据记录
        VIContainer.empty();
        VILibrary.InnerObjects.existingVIArray = [];
        VILibrary.InnerObjects.dataLineArray = [];
        ready();
        parseImportVIInfo($.parseJSON(this.result));
    }
}

init();

function containerResize () {

    let height = window.innerHeight * 0.95 > 600 ? window.innerHeight * 0.95 : 600;
    sideBar.css('height', height);
    VIContainer.css('height', height);
}

window.addEventListener('resize', containerResize, false);
