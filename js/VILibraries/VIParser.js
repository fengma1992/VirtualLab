/**
 * Created by Fengma on 2016/11/17.
 */

'use strict';
let bd = $('body');
let mainContainer = $('<div id="container-div" class="rowFlexDiv"></div>');
let sideBar = $('<div id="sideBar" class="draggable-sideBar"></div>');
let VIContainer = $('<div id="VIContainer" class="draggable-div" ondrop="drop(event)" ondragover="allowDrop(event)"></div>');
let contextMenu = $('<div id="menu"></div>');

VIContainer.append(contextMenu);
mainContainer.append(sideBar);
mainContainer.append(VIContainer);
bd.append(mainContainer);

let instance, mainTimer;
let bindInfoArr = [];//二维数组，第二维分别记录输出VI、输入VI
let setVIDataIndex = 0;
let dataObject = {
    AudioVICount: 0,
    BallBeamVICount: 0,
    ButtonVICount: 0,
    WaveVICount: 0,
    AddVICount: 0,
    DCOutputVICount: 0,
    FFTVICount: 0,
    KnobVICount: 0,
    OrbitWaveVICount: 0,
    PIDVICount: 0,
    RelayVICount: 0,
    RotorExperimentalRigVICount: 0,
    RoundPanelVICount: 0,
    TextVICount: 0,
    DifferentiationResponseVICount: 0,
    InertiaResponseVICount: 0,
    IntegrationResponseVICount: 0,
    OscillationResponseVICount: 0,
    ProportionDifferentiationResponseVICount: 0,
    ProportionInertiaResponseVICount: 0,
    ProportionIntegrationResponseVICount: 0,
    ProportionResponseVICount: 0,
    SignalGeneratorVICount: 0,
    AddVI: [],
    AudioVI: [],
    BallBeamVI: [],
    ButtonVI: [],
    WaveVI: [],
    DCOutputVI: [],
    FFTVI: [],
    KnobVI: [],
    OrbitWaveVI: [],
    PIDVI: [],
    RelayVI: [],
    RotorExperimentalRigVI: [],
    RoundPanelVI: [],
    TextVI: [],
    ProportionResponseVI: [],
    IntegrationResponseVI: [],
    DifferentiationResponseVI: [],
    InertiaResponseVI: [],
    OscillationResponseVI: [],
    ProportionIntegrationResponseVI: [],
    ProportionDifferentiationResponseVI: [],
    ProportionInertiaResponseVI: [],
    SignalGeneratorVI: []
};

function checkIfTargetValueBound (targetElement, checkedValue) {

    let i;
    for (i = 0; i < targetElement.source.length; i += 1) {

        if (targetElement.source[i][1] === checkedValue) {
            return targetElement.source[i][0].cnText;
        }
    }
    return false;
}

//向记录数组中添加绑定对
function addBindInfoToArr (sourceElement, targetElement) {

    if (bindInfoArr.indexOf([sourceElement, targetElement]) === -1) {

        bindInfoArr.push([sourceElement, targetElement]);
    }
}

//从记录数组中删除绑定对
function deleteBindInfoFromArr (sourceElement, targetElement) {

    if (bindInfoArr.indexOf([sourceElement, targetElement]) !== -1) {

        bindInfoArr.splice(bindInfoArr.indexOf([sourceElement, targetElement]), 1);
    }
}

function getObjectVIById (VIId) {

    let VIInfo = VIId.split('-');
    return dataObject[VIInfo[0]][VIInfo[1]];
}

function showBox (VICanvas) {

    let canvasId = VICanvas.id;
    let VI = getObjectVIById(canvasId);

    window.B = G.box(VI.boxTitle, VI.boxContent, 1, function () { getObjectVIById(canvasId).setInitialData();});
}

function setVIData (VI, sourceData, sourceDataType) {

    if (VI.name === 'AddVI') {

        if (sourceDataType === 1) {

            VI.setOriginalData(sourceData);
        }
        else if (sourceDataType === 2) {

            VI.setData(sourceData);
        }
    }
    else if (VI.name === 'SignalGeneratorVI') {
        if (sourceDataType === 1) {

            VI.amp = sourceData;
            VI.ampSetFlag = true;
        }
        else if (sourceDataType === 2) {

            VI.frequency = sourceData;
            VI.frequencySetFlag = true;
        }
        if (VI.ampSetFlag && VI.frequencySetFlag) {

            VI.phase += 10;
            VI.setData(VI.amp, VI.frequency, VI.phase);
            VI.ampSetFlag = false;
            VI.frequencySetFlag = false;
        }
    }
    else {

        VI.setData(sourceData);
    }
}

function getOutput (VI, outputType) {

    if (VI.name === 'BallBeamVI') {

        if (outputType === 1) {

            return VI.angelOutput;  //输出角度数组
        }
        if (outputType === 2) {

            return VI.positionOutput;  //输出位置数组

        }
        if (outputType === 3) {

            return VI.markPosition;  //输出标记位置
        }
    }
    else if (VI.name === 'RotorExperimentalRigVI') {

        if (outputType === 1) {

            return VI.signalOutput;  //输出时域信号

        }
        if (outputType === 2) {

            return VI.frequencyOutput;  //输出频域信号

        }
        if (outputType === 3) {

            return VI.orbitOutput;  //输出轴心位置

        }
        if (outputType === 4) {

            return VI.rotateFrequency;  //输出旋转频率

        }
    }
    else {

        return VI.output;  //输出数组
    }
}

function setData () {

    if (setVIDataIndex > 0) {

        return false;
    }

    for (setVIDataIndex = 0; setVIDataIndex < bindInfoArr.length; setVIDataIndex += 1) {

        let i, sourceData, sourceDataType;
        //查找sourceVI的输出参数
        for (i = 0; i < bindInfoArr[setVIDataIndex][0].target.length; i += 1) {

            if (bindInfoArr[setVIDataIndex][0].target[i][0] === bindInfoArr[setVIDataIndex][1]) {

                sourceData = getOutput(bindInfoArr[setVIDataIndex][0], bindInfoArr[setVIDataIndex][0].target[i][1]);
                break;
            }
        }

        //查找targetVI的输入参数类型
        for (i = 0; i < bindInfoArr[setVIDataIndex][1].source.length; i += 1) {

            if (bindInfoArr[setVIDataIndex][1].source[i][0] === bindInfoArr[setVIDataIndex][0]) {

                sourceDataType = bindInfoArr[setVIDataIndex][1].source[i][1];
                break;
            }
        }
        setVIData(bindInfoArr[setVIDataIndex][1], sourceData, sourceDataType);
    }

    setVIDataIndex = 0;
}

//用于开关VI来控制全局启停
function toggleStart (VICanvas) {

    let buttonVI = getObjectVIById(VICanvas.id);

    if (buttonVI.cnText === '启动') {

        buttonVI.cnText = '停止';
        buttonVI.fillStyle = 'red';
        buttonVI.draw();

        mainTimer = window.setInterval(function () {
            if (bindInfoArr.length === 0) {

                window.clearInterval(mainTimer);
                return false;
            }
            setData();
        }, 50);
    }
    else {

        buttonVI.fillStyle = 'silver';
        buttonVI.cnText = '启动';
        buttonVI.draw();

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

    if (outputPointCount != 0) {

        instance.addEndpoint(id, outputEndpoint, {anchor: outputAnchors, uuid: 'output-' + id});
    }
    if (inputPointCount != 0) {

        instance.addEndpoint(id, inputEndpoint, {anchor: inputAnchors, uuid: 'input-' + id});
    }
}

function VIDraw (canvas) {

    VIContainer.append(canvas);
    instance.draggable(canvas);
    let VIInfo = canvas.id.split('-'),
        tempVI = new VILibrary.VI[VIInfo[0]](canvas, true);

    dataObject[VIInfo[0]].push(tempVI);
    addEndpoints(canvas.id, tempVI.outputPointCount, tempVI.inputPointCount);

}

function allowDrop (e) {

    e.preventDefault();
}

function drag (e) {

    e.dataTransfer.setData('Text', e.target.id);
}

function drop (e) {

    e.preventDefault();
    let VICanvas = document.getElementById(e.dataTransfer.getData('Text'));
    let newVICanvas = document.createElement('canvas'), i;
    for (i = 0; i < VICanvas.attributes.length - 3; i += 1) {//后三个属性为侧栏中拖动属性，主VI界面不需要

        newVICanvas.setAttribute(VICanvas.attributes.item(i).nodeName, VICanvas.getAttribute(VICanvas.attributes.item(i).nodeName));
    }
    newVICanvas.setAttribute('oncontextmenu', 'showContextMenu(event, this)');
    newVICanvas.width = VICanvas.width * VICanvas.getAttribute('zoom');
    newVICanvas.height = VICanvas.height * VICanvas.getAttribute('zoom');
    newVICanvas.style.left = (e.offsetX - newVICanvas.width / 2) + 'px';
    newVICanvas.style.top = (e.offsetY - newVICanvas.height / 2) + 'px';

    newVICanvas.id = VICanvas.id + '-' + dataObject[VICanvas.id + 'Count']++;

    if (VICanvas.id === 'ButtonVI') {

        newVICanvas.setAttribute('onclick', 'toggleStart(this)');//向开关绑定启动函数
    }
    new VIDraw(newVICanvas);
}

function toggleDrag (info) {

    instance.toggleDraggable($('#' + $(info).attr('canvasid')));
}

function deleteVI (info) {

    let canvasId = $(info).attr('canvasid');
    let canvas = $('#' + canvasId);
    instance.detachAllConnections(canvas);
    let VI = getObjectVIById(canvasId);
    canvas.remove();
    console.log('VIDeleted');

}
function showContextMenu (e, canvas) {

    e = e || window.event;
    e.preventDefault(); //阻止右键默认菜单

    //鼠标点的坐标
    let oX = e.clientX;
    let oY = e.clientY;
    let btn_Lock = $('<span canvasid="' + canvas.id + '" onclick="toggleDrag(this)">锁定</span>');
    let btn_Delete = $('<span canvasid="' + canvas.id + '" onclick="deleteVI(this)">删除</span>');
    contextMenu.append(btn_Lock);
    contextMenu.append(btn_Delete);
    //菜单出现后的位置
    contextMenu.css('display', 'block');
    contextMenu.css('left', oX);
    contextMenu.css('top', oY);
    return false;
}

VIContainer.click(function () {

    contextMenu.css('display', 'none');
});

function createCanvas (id, className, width, height, zoomValue, showBoxFlag) {

    let canvas = $('<canvas></canvas>');
    canvas.attr('id', id);
    canvas.attr('class', className);
    canvas.attr('width', width);
    canvas.attr('height', height);
    if (showBoxFlag) {

        canvas.attr('ondblclick', 'showBox(this)');
    }
    canvas.attr('zoom', zoomValue);
    canvas.attr('draggable', 'true');
    canvas.attr('ondragstart', 'drag(event)');
    sideBar.append(canvas);
    return canvas;

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

            let sourceElement = getObjectVIById(connectionInfo.connection.sourceId);
            let targetElement = getObjectVIById(connectionInfo.connection.targetId);

            //对多输出控件判断
            if (sourceElement.name === 'BallBeamVI') {

                window.O = G.box('请选择' + sourceElement.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="output-type" value="1" onclick="O.close()">' +
                    '<label class="input-label" for="type1">反馈角度</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="output-type" value="2" onclick="O.close()">' +
                    '<label class="input-label" for="type2">反馈位置</label></div>' +
                    '<div><input type="radio" id="type3" class="radioInput" name="output-type" value="3" onclick="O.close()">' +
                    '<label class="input-label" for="type3">标记位置</label></div>' +
                    '</div>',
                    1, function () {

                        let checkedValue = Number($('input[name=output-type]:checked').val());
                        if (!checkedValue) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert('未选择' + sourceElement.cnText + '输出参数！', 1, 1500);
                            return false;
                        }

                        addBindInfoToArr(sourceElement, targetElement);
                        sourceElement.target.push([targetElement, checkedValue]);
                    });
            }
            else if (sourceElement.name === 'RotorExperimentalRigVI') {

                window.O = G.box('请选择' + sourceElement.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="output-type" value="1" onclick="O.close()">' +
                    '<label class="input-label" for="type1">时域信号</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="output-type" value="2" onclick="O.close()">' +
                    '<label class="input-label" for="type2">频域信号</label></div>' +
                    '<div><input type="radio" id="type3" class="radioInput" name="output-type" value="3" onclick="O.close()">' +
                    '<label class="input-label" for="type3">轴心轨迹</label></div>' +
                    '<div><input type="radio" id="type4" class="radioInput" name="output-type" value="4" onclick="O.close()">' +
                    '<label class="input-label" for="type4">旋转频率</label></div>' +
                    '</div>',
                    1, function () {

                        let checkedValue = Number($('input[name=output-type]:checked').val());
                        if (!checkedValue) {

                            if (connectionInfo != null && connectionInfo != undefined) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert('未选择' + sourceElement.cnText + '输出参数！', 1, 1500);
                            return false;
                        }

                        addBindInfoToArr(sourceElement, targetElement);
                        sourceElement.target.push([targetElement, checkedValue]);
                    });
            }

            //默认输出数组
            else {

                addBindInfoToArr(sourceElement, targetElement);
                sourceElement.target.push([targetElement, 2]);
            }

            //对于多输入控件,进行输入端口判断
            if (targetElement.name === 'AddVI') {

                window.I = G.box('请选择' + targetElement.cnText + '输入参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="AddVI-type" value="1" alt="初值" onclick="I.close()">' +
                    '<label class="input-label" for="type1">初值</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="AddVI-type" value="2" alt="反馈值" onclick="I.close()">' +
                    '<label class="input-label" for="type2">反馈值</label></div>' +
                    '</div>',
                    1, function () {

                        let checkedRadio = $('input[name=AddVI-type]:checked');
                        let checkedValue = Number(checkedRadio.val());
                        if (!checkedValue) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert('未选择' + targetElement.cnText + '输入参数！', 1, 1500);
                            return false;
                        }
                        let name = checkIfTargetValueBound(targetElement, checkedValue);    //检测此输入端口是否已与其他VI连接
                        if (name) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert(targetElement.cnText + checkedRadio.attr('alt') + '已与' + name + '绑定！', 1, 1500);
                            return false;
                        }
                        addBindInfoToArr(sourceElement, targetElement);
                        targetElement.source.push([sourceElement, checkedValue]);
                    }
                );
            }
            else if (targetElement.name === 'SignalGeneratorVI') {

                window.I = G.box('请选择' + targetElement.cnText + '输入参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="SignalGeneratorVI-type" value="1" alt="幅值" onclick="I.close()">' +
                    '<label class="input-label" for="type1">幅值</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="SignalGeneratorVI-type" value="2" alt="频率" onclick="I.close()">' +
                    '<label class="input-label" for="type2">频率</label></div>' +
                    '</div>',
                    1, function () {

                        let checkedRadio = $('input[name=SignalGeneratorVI-type]:checked');
                        let checkedValue = Number(checkedRadio.val());
                        if (!checkedValue) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert('未选择' + targetElement.cnText + '输入参数！', 1, 1500);
                            return false;
                        }
                        let name = checkIfTargetValueBound(targetElement, checkedValue);    //检测此输入端口是否已与其他VI连接
                        if (name) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            G.alert(targetElement.cnText + checkedRadio.attr('alt') + '已与' + name + '绑定！', 1, 1500);
                            return false;
                        }
                        addBindInfoToArr(sourceElement, targetElement);
                        targetElement.source.push([sourceElement, checkedValue]);
                    }
                );
            }
            else {

                addBindInfoToArr(sourceElement, targetElement);
                targetElement.source[0] = [sourceElement, 0];
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
            let sourceElement = getObjectVIById(connectionInfo.connection.sourceId);
            let targetElement = getObjectVIById(connectionInfo.connection.targetId);

            let i;
            for (i = 0; i < sourceElement.target.length; i += 1) {

                if (sourceElement.target[i][0] === targetElement) {

                    sourceElement.target.splice(i, 1);
                    break;
                }
            }
            for (i = 0; i < targetElement.source.length; i += 1) {

                if (targetElement.source[i][0] === sourceElement) {

                    targetElement.source.splice(i, 1);
                    break;
                }
            }
            deleteBindInfoFromArr(sourceElement, targetElement);
        });
    });

    jsPlumb.fire('jsPlumbDemoLoaded', instance);

}

function containerResize () {

    let height = window.innerWidth * 0.95 > 600 ? window.innerHeight * 0.95 : 600;
    sideBar.css('height', height);
    VIContainer.css('height', height);
}

function init () {

    new VILibrary.VI.AudioVI(createCanvas('AudioVI', 'draggable-element', 104, 90, 1, false));
    new VILibrary.VI.OrbitWaveVI(createCanvas('OrbitWaveVI', 'draggable-element', 104, 90, 3, false));
    new VILibrary.VI.WaveVI(createCanvas('WaveVI', 'draggable-element', 162, 90, 3, false));
    new VILibrary.VI.BallBeamVI(createCanvas('BallBeamVI', 'draggable-element', 162, 90, 4, false));
    new VILibrary.VI.RotorExperimentalRigVI(createCanvas('RotorExperimentalRigVI', 'draggable-element', 162, 90, 4, false));
    new VILibrary.VI.TextVI(createCanvas('TextVI', 'draggable-element', 104, 45, 1, true));
    new VILibrary.VI.ButtonVI(createCanvas('ButtonVI', 'draggable-element', 104, 45, 1, false));
    new VILibrary.VI.KnobVI(createCanvas('KnobVI', 'draggable-element', 45, 45, 3, true));
    new VILibrary.VI.RoundPanelVI(createCanvas('RoundPanelVI', 'draggable-element', 45, 45, 3, true));
    new VILibrary.VI.FFTVI(createCanvas('FFTVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.AddVI(createCanvas('AddVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.DCOutputVI(createCanvas('DCOutputVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.PIDVI(createCanvas('PIDVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.RelayVI(createCanvas('RelayVI', 'draggable-element', 45, 45, 1, false));
    new VILibrary.VI.ProportionResponseVI(createCanvas('ProportionResponseVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.IntegrationResponseVI(createCanvas('IntegrationResponseVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.DifferentiationResponseVI(createCanvas('DifferentiationResponseVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.InertiaResponseVI(createCanvas('InertiaResponseVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.OscillationResponseVI(createCanvas('OscillationResponseVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.ProportionIntegrationResponseVI(createCanvas('ProportionIntegrationResponseVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.ProportionDifferentiationResponseVI(createCanvas('ProportionDifferentiationResponseVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.ProportionInertiaResponseVI(createCanvas('ProportionInertiaResponseVI', 'draggable-element', 45, 45, 1, true));
    new VILibrary.VI.SignalGeneratorVI(createCanvas('SignalGeneratorVI', 'draggable-element', 45, 45, 1, true));

    ready();
    containerResize();
}

init();

window.addEventListener('resize', containerResize, false);