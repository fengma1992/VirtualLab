/**
 * Created by Fengma on 2016/11/17.
 */

'use strict';
let bd = $('body');
let navigationBar = $('<div id="navigationBar-div"></div>');
let fileImporter = $('<input type="file" id="file-input" onchange="importVI()">');
let importBtn = $('<input type="button" value="导入">');
let exportBtn = $('<input type="button" value="导出" onclick="exportVI()">');
let startBtn = $('<input type="button" value="启动" onclick="toggleStart()">');
let resetBtn = $('<input type="button" value="重置" onclick="init()">');
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
navigationBar.append(importBtn);
navigationBar.append(exportBtn);
navigationBar.append(startBtn);
navigationBar.append(resetBtn);
bd.append(navigationBar);
bd.append(mainContainer);

let instance;
let mainTimer;
let bindInfoArr = [];//二维数组，第二维分别记录输出VI、输入VI
let setVIDataIndex = 0;
let dataObject = {
    // AudioVICount: 0,
    // BallBeamVICount: 0,
    // ButtonVICount: 0,
    // WaveVICount: 0,
    // AddVICount: 0,
    // DCOutputVICount: 0,
    // FFTVICount: 0,
    // KnobVICount: 0,
    // OrbitWaveVICount: 0,
    // PIDVICount: 0,
    // RelayVICount: 0,
    // RotorExperimentalRigVICount: 0,
    // RoundPanelVICount: 0,
    // TextVICount: 0,
    // DifferentiationResponseVICount: 0,
    // InertiaResponseVICount: 0,
    // IntegrationResponseVICount: 0,
    // OscillationResponseVICount: 0,
    // ProportionDifferentiationResponseVICount: 0,
    // ProportionInertiaResponseVICount: 0,
    // ProportionIntegrationResponseVICount: 0,
    // ProportionResponseVICount: 0,
    // SignalGeneratorVICount: 0,
    // AddVI: [],
    // AudioVI: [],
    // BallBeamVI: [],
    // ButtonVI: [],
    // WaveVI: [],
    // DCOutputVI: [],
    // FFTVI: [],
    // KnobVI: [],
    // OrbitWaveVI: [],
    // PIDVI: [],
    // RelayVI: [],
    // RotorExperimentalRigVI: [],
    // RoundPanelVI: [],
    // TextVI: [],
    // ProportionResponseVI: [],
    // IntegrationResponseVI: [],
    // DifferentiationResponseVI: [],
    // InertiaResponseVI: [],
    // OscillationResponseVI: [],
    // ProportionIntegrationResponseVI: [],
    // ProportionDifferentiationResponseVI: [],
    // ProportionInertiaResponseVI: [],
    // SignalGeneratorVI: []
};

function checkIfTargetInputValueBound (targetVI, targetInputType) {

    for (let sourceInfo of targetVI.source) {

        if (sourceInfo[1] === targetInputType) {
            return sourceInfo[0].cnText;
        }

    }
    return false;
}

//向记录数组中添加绑定对
function addBindInfoToArr (bindInfo) {

    if (bindInfoArr.indexOf(bindInfo) === -1) {

        bindInfoArr.push(bindInfo);
    }
}

//从记录数组中删除绑定对
function deleteBindInfoFromArr (bindInfo) {

    if (bindInfoArr.indexOf(bindInfo) !== -1) {

        bindInfoArr.splice(bindInfoArr.indexOf(bindInfo), 1);
    }
}

function getVIById (VIId) {

    let VIInfo = VIId.split('-');
    return dataObject[VIInfo[0]][VIInfo[1]];
}

function showBox (VICanvas) {

    let canvasId = VICanvas.id;
    let VI = getVIById(canvasId);

    if (VI.boxTitle) {

        window.B = G.box(VI.boxTitle, VI.boxContent, 1, function () { getVIById(canvasId).setInitialData();});
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

//控制全局启停
function toggleStart () {

    if (startBtn.val() === '启动') {

        startBtn.val('停止');
        navigationBar.css('background-color', 'green');
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
        navigationBar.css('background-color', 'white');
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

    let endpoints = {};
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

        endpoints.outputEndpoint = instance.addEndpoint(id, outputEndpoint, {
            anchor: outputAnchors,
            uuid: 'output-' + id
        });
    }
    if (inputPointCount !== 0) {

        endpoints.inputEndPoint = instance.addEndpoint(id, inputEndpoint, {anchor: inputAnchors, uuid: 'input-' + id});
    }
    return endpoints;
}

function VIDraw (canvas) {

    VIContainer.append(canvas);
    instance.draggable(canvas);
    let VIName = canvas.attr('id').split('-')[0];
    let tempVI = new VILibrary.VI[VIName](canvas, true);

    if (!dataObject[VIName]) {
        dataObject[VIName] = [];
    }
    dataObject[VIName].push(tempVI);
    let endpoints = addEndpoints(canvas.attr('id'), tempVI.outputPointCount, tempVI.inputPointCount);

    return {VI: tempVI, endpoints: endpoints};
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

    if (!dataObject[VIName + 'Count']) {

        dataObject[VIName + 'Count'] = 0;
    }

    newVICanvas.attr('id', VIName + '-' + dataObject[VIName + 'Count']++);
    newVICanvas.attr('class', VICanvas.attr('class'));
    newVICanvas.attr('width', VICanvas.width() * VICanvas.attr('zoom'));
    newVICanvas.attr('height', VICanvas.height() * VICanvas.attr('zoom'));
    newVICanvas.css('left', (e.offsetX - newVICanvas.width() / 2) + 'px');
    newVICanvas.css('top', (e.offsetY - newVICanvas.height() / 2) + 'px');
    newVICanvas.attr('ondblclick', 'showBox(this)');
    newVICanvas.attr('oncontextmenu', 'showContextMenu(event, this)');

    VIDraw(newVICanvas);
}

function deleteVI (canvas) {

    let canvasId = canvas.id;
    let VI = getVIById(canvasId);

    if (dataObject[VI.name].indexOf(VI) !== -1) {

        dataObject[VI.name].splice(dataObject[VI.name].indexOf(VI), 1);
        dataObject[VI.name + 'Count'] -= 1;
    }
    instance.detachAllConnections(canvas);
    instance.deleteEndpoint('output-' + canvasId);
    instance.deleteEndpoint('input-' + canvasId);
    canvas.remove();
    ready();
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

            let sourceId = connectionInfo.connection.sourceId;
            let targetId = connectionInfo.connection.targetId;
            let sourceVI = getVIById(sourceId);
            let targetVI = getVIById(targetId);
            let targetInputType = 0;
            let sourceOutputType = 0;

            addBindInfoToArr(sourceId + ' ' + targetId);
            //对多输出控件判断
            if (sourceVI.outputBoxTitle) {

                window.O = G.box(sourceVI.outputBoxTitle, sourceVI.outputBoxContent, 1,
                    function () {

                        sourceOutputType = Number($('input[name=output-type]:checked').val());
                        if (!sourceOutputType) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert('未选择' + sourceVI.cnText + '输出参数！', 1, 1500);
                            return false;
                        }
                        sourceVI.target.push([targetVI, sourceOutputType]);
                    });
            }
            else {

                sourceVI.target.push([targetVI, sourceOutputType]);
            }

            //对于多输入控件,进行输入端口判断
            if (targetVI.inputBoxTitle) {

                window.I = G.box(targetVI.inputBoxTitle, targetVI.inputBoxContent, 1,
                    function () {

                        let checkedRadio = $('input[name=input-type]:checked');
                        targetInputType = Number(checkedRadio.val());
                        if (!targetInputType) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert('未选择' + targetVI.cnText + '输入参数！', 1, 1500);
                            return false;
                        }
                        let name = checkIfTargetInputValueBound(targetVI, targetInputType);    //检测此输入端口是否已与其他VI连接
                        if (name) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert(targetVI.cnText + checkedRadio.attr('alt') + '已与' + name + '绑定！', 1, 1500);
                            return false;
                        }
                        targetVI.source.push([sourceVI, targetInputType]);
                    }
                );
            }
            else {

                targetVI.source[0] = [sourceVI, targetInputType]; //只有一个输入，所以直接给source[0]赋值
            }
        });

        // 绑定点击删除连线
        instance.bind('click', function (conn) {
            G.confirm("删除连接?", function (z) {
                if (z) {

                    instance.detach(conn);
                }
            }, 1);
        });

        //监听断开连线事件
        instance.bind('connectionDetached', function (connectionInfo) {

            console.log('detached');
            let sourceId = connectionInfo.connection.sourceId;
            let targetId = connectionInfo.connection.targetId;
            let sourceVI = getVIById(sourceId);
            let targetVI = getVIById(targetId);

            for (let targetInfo of sourceVI.target) {

                if (targetInfo[0] === targetVI) {

                    sourceVI.target.splice(sourceVI.target.indexOf(targetInfo), 1);
                    break;
                }
            }
            for (let sourceInfo of targetVI.source) {

                if (sourceInfo[0] === sourceVI) {

                    targetVI.source.splice(targetVI.source.indexOf(sourceInfo), 1);
                    break;
                }
            }
            deleteBindInfoFromArr(sourceId + ' ' + targetId);
        });
    });

    jsPlumb.fire('jsPlumbDemoLoaded', instance);

}

function containerResize () {

    let height = window.innerWidth * 0.95 > 600 ? window.innerHeight * 0.95 : 600;
    sideBar.css('height', height);
    VIContainer.css('height', height);
}

function addCanvasToSideBar (id, className, width, height, zoomValue) {

    let canvas = $('<canvas></canvas>');
    canvas.attr('id', id);
    canvas.attr('class', className);
    canvas.attr('width', width);
    canvas.attr('height', height);
    canvas.attr('zoom', zoomValue);
    canvas.attr('draggable', 'true');
    canvas.attr('ondragstart', 'drag(event)');
    sideBar.append(canvas);
    return canvas;

}

function init () {

    bindInfoArr = [];
    dataObject = {};
    sideBar.html('');
    VIContainer.html('');

    new VILibrary.VI.AudioVI(addCanvasToSideBar('AudioVI', 'draggable-element', 104, 90, 1));
    new VILibrary.VI.OrbitWaveVI(addCanvasToSideBar('OrbitWaveVI', 'draggable-element', 104, 90, 3));
    new VILibrary.VI.WaveVI(addCanvasToSideBar('WaveVI', 'draggable-element', 162, 90, 3));
    new VILibrary.VI.BallBeamVI(addCanvasToSideBar('BallBeamVI', 'draggable-element', 162, 90, 4));
    new VILibrary.VI.RotorExperimentalRigVI(addCanvasToSideBar('RotorExperimentalRigVI', 'draggable-element', 162, 90, 4));
    new VILibrary.VI.TextVI(addCanvasToSideBar('TextVI', 'draggable-element', 104, 45, 1));
    new VILibrary.VI.KnobVI(addCanvasToSideBar('KnobVI', 'draggable-element', 45, 45, 3));
    new VILibrary.VI.RoundPanelVI(addCanvasToSideBar('RoundPanelVI', 'draggable-element', 45, 45, 3));
    new VILibrary.VI.FFTVI(addCanvasToSideBar('FFTVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.AddVI(addCanvasToSideBar('AddVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.DCOutputVI(addCanvasToSideBar('DCOutputVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.PIDVI(addCanvasToSideBar('PIDVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.RelayVI(addCanvasToSideBar('RelayVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.ProportionResponseVI(addCanvasToSideBar('ProportionResponseVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.IntegrationResponseVI(addCanvasToSideBar('IntegrationResponseVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.DifferentiationResponseVI(addCanvasToSideBar('DifferentiationResponseVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.InertiaResponseVI(addCanvasToSideBar('InertiaResponseVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.OscillationResponseVI(addCanvasToSideBar('OscillationResponseVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.ProportionIntegrationResponseVI(addCanvasToSideBar('ProportionIntegrationResponseVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.ProportionDifferentiationResponseVI(addCanvasToSideBar('ProportionDifferentiationResponseVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.ProportionInertiaResponseVI(addCanvasToSideBar('ProportionInertiaResponseVI', 'draggable-element', 45, 45, 1));
    new VILibrary.VI.SignalGeneratorVI(addCanvasToSideBar('SignalGeneratorVI', 'draggable-element', 45, 45, 1));

    ready();
    containerResize();
}

init();

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

    for (let VIInfo of json.VIInfo) {

        try {

            let sourceInfo = VIInfo.sourceInfo;
            let targetInfo = VIInfo.targetInfo;
            let sourceVIName = sourceInfo.id.split('-')[0];
            let targetVIName = targetInfo.id.split('-')[0];
            let sourceCanvas = createCanvas(sourceInfo.id, sourceInfo.className, sourceInfo.width, sourceInfo.height, sourceInfo.top, sourceInfo.left);
            let targetCanvas = createCanvas(targetInfo.id, targetInfo.className, targetInfo.width, targetInfo.height, targetInfo.top, targetInfo.left);

            let sourceObject = VIDraw(sourceCanvas);//返回一个Object, key分别为VI和endpoints
            let targetObject = VIDraw(targetCanvas);
            if (!dataObject[sourceVIName + 'Count']) {

                dataObject[sourceVIName + 'Count'] = 0;
            }
            dataObject[sourceVIName + 'Count']++;
            if (!dataObject[targetVIName + 'Count']) {

                dataObject[targetVIName + 'Count'] = 0;
            }
            dataObject[targetVIName + 'Count']++;
            let sourceVI = sourceObject.VI;
            let targetVI = targetObject.VI;
            sourceVI.target.push([targetVI, sourceVI.outputType]);
            targetVI.source.push([sourceVI, targetVI.inputType]);
            addBindInfoToArr(sourceInfo.id + ' ' + targetInfo.id);
            instance.connect({
                source: sourceObject.endpoints.outputEndpoint,
                target: targetObject.endpoints.inputEndPoint
            });
        }
        catch (e) {

            //先初始化数据记录
            bindInfoArr = [];
            dataObject = {};
            console.log('Parse ImportVI Error: ' + e);
        }
    }
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

    let selectedFile = fileImporter[0].files[0];

    let reader = new FileReader();
    reader.readAsText(selectedFile);
    reader.onload = function () {

        VIContainer.html('');
        ready();
        //先初始化数据记录
        bindInfoArr = [];
        dataObject = {};
        parseImportVIInfo($.parseJSON(this.result));
    }
}