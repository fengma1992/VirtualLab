/**
 * Created by Fengma on 2016/11/17.
 */

'use strict';

const sideBar = document.getElementById('sideBar');
const VIContainer = document.getElementById('container');

let instance, mainTimer;
let dataSetBox = [], inputSetBox = [], outputSetBox = [];
let dataObject = {
    THREECount: 0,
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
    THREE: [],
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
    SignalGeneratorVI: [],
};

function init () {
    new VILibrary.VI.AddVI(document.getElementById('AddVI-canvas'));
    new VILibrary.VI.AudioVI(document.getElementById('AudioVI-canvas'));
    new VILibrary.VI.BallBeamVI(document.getElementById('BallBeamVI-canvas'));
    new VILibrary.VI.ButtonVI(document.getElementById('ButtonVI-canvas'));
    new VILibrary.VI.DCOutputVI(document.getElementById('DCOutputVI-canvas'));
    new VILibrary.VI.FFTVI(document.getElementById('FFTVI-canvas'));
    new VILibrary.VI.KnobVI(document.getElementById('KnobVI-canvas'));
    new VILibrary.VI.OrbitWaveVI(document.getElementById('OrbitWaveVI-canvas'));
    new VILibrary.VI.PIDVI(document.getElementById('PIDVI-canvas'));
    new VILibrary.VI.RelayVI(document.getElementById('RelayVI-canvas'));
    new VILibrary.VI.RotorExperimentalRigVI(document.getElementById('RotorExperimentalRigVI-canvas'));
    new VILibrary.VI.RoundPanelVI(document.getElementById('RoundPanelVI-canvas'));
    new VILibrary.VI.SignalGeneratorVI(document.getElementById('SignalGeneratorVI-canvas'));
    new VILibrary.VI.TextVI(document.getElementById('TextVI-canvas'));
    new VILibrary.VI.WaveVI(document.getElementById('WaveVI-canvas'));
    new VILibrary.VI.ProportionResponseVI(document.getElementById('ProportionResponseVI-canvas'));
    new VILibrary.VI.IntegrationResponseVI(document.getElementById('IntegrationResponseVI-canvas'));
    new VILibrary.VI.DifferentiationResponseVI(document.getElementById('DifferentiationResponseVI-canvas'));
    new VILibrary.VI.InertiaResponseVI(document.getElementById('InertiaResponseVI-canvas'));
    new VILibrary.VI.OscillationResponseVI(document.getElementById('OscillationResponseVI-canvas'));
    new VILibrary.VI.ProportionIntegrationResponseVI(document.getElementById('ProportionIntegrationResponseVI-canvas'));
    new VILibrary.VI.ProportionDifferentiationResponseVI(document.getElementById('ProportionDifferentiationResponseVI-canvas'));
    new VILibrary.VI.ProportionInertiaResponseVI(document.getElementById('ProportionInertiaResponseVI-canvas'));
    ready();
    containerResize();
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
                    click: function () {
                        //                            alert('you clicked on the arrow overlay')
                        //点击箭头事件
                    }
                }
            }]
        ],
        Container: 'container'
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

            let sourceArr = connectionInfo.connection.sourceId.split('-');
            let targetArr = connectionInfo.connection.targetId.split('-');
            let sourceElement = getObjectVIByName(sourceArr[0])[sourceArr[2]];
            let targetElement = getObjectVIByName(targetArr[0])[targetArr[2]];

            //对多输出控件判断
            if (sourceElement.name == 'BallBeamVI') {

                outputSetBox[0] = true;
                outputSetBox[1] = G.box('请选择' + sourceElement.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="output-type" value="1" onclick="outputSetBox[1].close()">' +
                    '<label class="input-label" for="type1">反馈角度</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="output-type" value="2" onclick="outputSetBox[1].close()">' +
                    '<label class="input-label" for="type2">反馈位置</label></div>' +
                    '<div><input type="radio" id="type3" class="radioInput" name="output-type" value="3" onclick="outputSetBox[1].close()">' +
                    '<label class="input-label" for="type3">标记位置</label></div>' +
                    '</div>',
                    1, function () {

                        outputSetBox[0] = false;
                        let outputType = document.getElementsByName('output-type');
                        let checkedValue = -1, i;
                        for (i = 0; i < outputType.length; i++) {

                            if (outputType[i].checked == true) {

                                checkedValue = outputType[i].value;
                                break;
                            }
                        }
                        if (checkedValue == -1) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            closeBox();
                            G.alert('未选择' + sourceElement.cnText + '输出参数！', 1, 1500);
                            return;
                        }

                        sourceElement.target.push([targetElement, checkedValue]);
                    });
            }
            else if (sourceElement.name == 'RotorExperimentalRigVI') {

                outputSetBox[0] = true;
                outputSetBox[1] = G.box('请选择' + sourceElement.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="output-type" value="1" onclick="outputSetBox[1].close()">' +
                    '<label class="input-label" for="type1">时域信号</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="output-type" value="2" onclick="outputSetBox[1].close()">' +
                    '<label class="input-label" for="type2">频域信号</label></div>' +
                    '<div><input type="radio" id="type3" class="radioInput" name="output-type" value="3" onclick="outputSetBox[1].close()">' +
                    '<label class="input-label" for="type3">轴心轨迹</label></div>' +
                    '<div><input type="radio" id="type4" class="radioInput" name="output-type" value="4" onclick="outputSetBox[1].close()">' +
                    '<label class="input-label" for="type4">旋转频率</label></div>' +
                    '</div>',
                    1, function () {

                        outputSetBox[0] = false;
                        let outputType = document.getElementsByName('output-type');
                        let checkedValue = -1;
                        for (let i = 0; i < outputType.length; i++) {

                            if (outputType[i].checked == true) {

                                checkedValue = outputType[i].value;
                                break;
                            }
                        }
                        if (checkedValue == -1) {

                            if (connectionInfo != null && connectionInfo != undefined) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            closeBox();
                            G.alert('未选择' + sourceElement.cnText + '输出参数！', 1, 1500);
                            return;
                        }

                        sourceElement.target.push([targetElement, checkedValue]);
                    });
            }
            //                else if (sourceElement.outputCount == 2) {
            //
            //                    outputSetBox[0] = true;
            //                    outputSetBox[1] = G.box('请选择' + sourceElement.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
            //                            '<div class="input-div">' +
            //                            '<input type="radio" class="radioInput" name="output-type" value="1" onclick="outputSetBox[1].close()">输出(单值)<br>' +
            //                            '<input type="radio" class="radioInput" name="output-type" value="2" onclick="outputSetBox[1].close()">输出(数组)<br>' +
            //                            '</div>',
            //                            1, function () {
            //
            //                                outputSetBox[0] = false;
            //                                let outputType = document.getElementsByName('output-type');
            //                                let checkedValue = -1;
            //                                for (let i = 0; i < outputType.length; i++) {
            //
            //                                    if (outputType[i].checked == true) {
            //
            //                                        checkedValue = outputType[i].value;
            //                                        break;
            //                                    }
            //                                }
            //                                if (checkedValue == -1) {
            //
            //                                    if (connectionInfo != null && connectionInfo != undefined) {
            //
            //                                        instance.detach(connectionInfo.connection);
            //                                        connectionInfo = null;
            //                                    }
            //                                    closeBox();
            //                                    G.alert('未选择' + sourceElement.cnText + '输出参数！', 1, 1500);
            //                                    return;
            //                                }
            //
            //                                sourceElement.target.push([targetElement, checkedValue]);
            //                            });
            //                }

            //默认输出数组
            else {

                sourceElement.target.push([targetElement, 2]);
            }

            //对于多输入控件,进行输入端口判断
            if (targetElement.name == 'AddVI') {

                inputSetBox[0] = true;
                inputSetBox[1] = G.box('请选择' + targetElement.cnText + '输入参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="AddVI-type" value="1" alt="初值" onclick="inputSetBox[1].close()">' +
                    '<label class="input-label" for="type1">初值</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="AddVI-type" value="2" alt="反馈值" onclick="inputSetBox[1].close()">' +
                    '<label class="input-label" for="type2">反馈值</label></div>' +
                    '</div>',
                    1, function () {

                        inputSetBox[0] = false;
                        let inputType = document.getElementsByName('AddVI-type');
                        let checkedValue = -1, i;
                        for (i = 0; i < inputType.length; i++) {

                            if (inputType[i].checked == true) {

                                checkedValue = inputType[i].value;
                                break;
                            }
                        }
                        if (checkedValue == -1) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            closeBox();
                            G.alert('未选择' + targetElement.cnText + '输入参数！', 1, 1500);
                            return;
                        }
                        let name = checkIfTargetValueBound(targetElement, checkedValue);    //检测此输入端口是否已与其他VI连接
                        if (name) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            closeBox();
                            G.alert(targetElement.cnText + inputType[i].alt + '已与' + name + '绑定！', 1, 1500);
                            return;
                        }
                        targetElement.source.push([sourceElement, checkedValue]);
                    }
                );
            }
            else if (targetElement.name == 'SignalGeneratorVI') {

                inputSetBox[0] = true;
                inputSetBox[1] = G.box('请选择' + targetElement.cnText + '输入参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="SignalGeneratorVI-type" value="1" alt="幅值" onclick="inputSetBox[1].close()">' +
                    '<label class="input-label" for="type1">幅值</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="SignalGeneratorVI-type" value="2" alt="频率" onclick="inputSetBox[1].close()">' +
                    '<label class="input-label" for="type2">频率</label></div>' +
                    '</div>',
                    1, function () {

                        inputSetBox[0] = false;
                        let inputType = document.getElementsByName('SignalGeneratorVI-type');
                        let checkedValue = -1, i;
                        for (i = 0; i < inputType.length; i++) {

                            if (inputType[i].checked == true) {

                                checkedValue = inputType[i].value;
                            }
                        }
                        if (checkedValue == -1) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            closeBox();
                            G.alert('未选择' + targetElement.cnText + '输入参数！', 1, 1500);
                            return;
                        }
                        let name = checkIfTargetValueBound(targetElement, checkedValue);    //检测此输入端口是否已与其他VI连接
                        if (name) {

                            if (connectionInfo) {

                                instance.detach(connectionInfo.connection);
                                connectionInfo = null;
                            }
                            closeBox();
                            G.alert(targetElement.cnText + inputType[i].alt + '已与' + name + '绑定！', 1, 1500);
                            return;
                        }
                        targetElement.source.push([sourceElement, checkedValue]);
                    }
                );
            }
            else {

                targetElement.source[0] = [sourceElement, 0];
                if (targetElement.name == 'BallBeamVI') {

                    window.setInterval(function () {
                        checkIfThreeDVIStarted(targetElement)
                    }, 1000);
                }
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

            let sourceArr = connectionInfo.connection.sourceId.split('-');
            let targetArr = connectionInfo.connection.targetId.split('-');
            let sourceElement = getObjectVIByName(sourceArr[0])[sourceArr[2]];
            let targetElement = getObjectVIByName(targetArr[0])[targetArr[2]];

            let i;
            for (i = 0; i < sourceElement.target.length; i++) {

                if (sourceElement.target[i][0] == targetElement) {

                    sourceElement.target.splice(i, 1);
                    break;
                }
            }
            for (i = 0; i < targetElement.source.length; i++) {

                if (targetElement.source[i][0] == sourceElement) {

                    targetElement.source.splice(i, 1);
                    break;
                }
            }
        });
    });

    jsPlumb.fire('jsPlumbDemoLoaded', instance);

}

function checkIfTargetValueBound (targetElement, checkedValue) {

    let i;
    for (i = 0; i < targetElement.source.length; i++) {

        if (targetElement.source[i][1] == checkedValue) {
            return targetElement.source[i][0].cnText;
        }
    }
    return false;
}

function checkIfThreeDVIStarted (threeDElement) {

    if (threeDElement.isStart) {

        findTimerExecutor(threeDElement);
    }
}

function getObjectVIByName (name) {

    switch (name) {

        case 'AddVI':
            return dataObject.AddVI;

        case 'AudioVI':
            return dataObject.AudioVI;

        case 'BallBeamVI':
            return dataObject.BallBeamVI;

        case 'ButtonVI':
            return dataObject.ButtonVI;

        case 'DCOutputVI':
            return dataObject.DCOutputVI;

        case 'FFTVI':
            return dataObject.FFTVI;

        case 'KnobVI':
            return dataObject.KnobVI;

        case 'OrbitWaveVI':
            return dataObject.OrbitWaveVI;

        case 'PIDVI':
            return dataObject.PIDVI;

        case 'RelayVI':
            return dataObject.RelayVI;

        case 'RotorExperimentalRigVI':
            return dataObject.RotorExperimentalRigVI;

        case 'RoundPanelVI':
            return dataObject.RoundPanelVI;

        case 'TextVI':
            return dataObject.TextVI;

        case 'ProportionResponseVI':
            return dataObject.ProportionResponseVI;

        case 'IntegrationResponseVI':
            return dataObject.IntegrationResponseVI;

        case 'DifferentiationResponseVI':
            return dataObject.DifferentiationResponseVI;

        case 'InertiaResponseVI':
            return dataObject.InertiaResponseVI;

        case 'OscillationResponseVI':
            return dataObject.OscillationResponseVI;

        case 'ProportionIntegrationResponseVI':
            return dataObject.ProportionIntegrationResponseVI;

        case 'ProportionDifferentiationResponseVI':
            return dataObject.ProportionDifferentiationResponseVI;

        case 'ProportionInertiaResponseVI':
            return dataObject.ProportionInertiaResponseVI;

        case 'SignalGeneratorVI':
            return dataObject.SignalGeneratorVI;

        case 'WaveVI':
            return dataObject.WaveVI;
    }
}

function startTimer (VICanvas) {

    let elementInfo = VICanvas.id.split('-');
    let element = getObjectVIByName(elementInfo[0])[elementInfo[2]];

    findTimerExecutor(element);
}

function showBox (VICanvas) {

    let elementInfo = VICanvas.id.split('-');
    let element = getObjectVIByName(elementInfo[0])[elementInfo[2]];
    switch (elementInfo[0]) {

        case 'AddVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('请输入初始值&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">初值:</span><input type="number" id="AddVI-input" value="' + element.originalInput + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setAddVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'PIDVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('请输入PID参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">P:</span><input type="number" id="PIDVI-input-1" value="' + element.P + '" class="normalInput">' +
                '<span class="normalSpan">I:</span><input type="number" id="PIDVI-input-2" value="' + element.I + '" class="normalInput">' +
                '<span class="normalSpan">D:</span><input type="number" id="PIDVI-input-3" value="' + element.D + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setPIDVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'TextVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('请输入保留小数位数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<input type="number" id="TextVI-input" value="' + element.decimalPlace + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setTextVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'DCOutputVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('请设置输出值&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">初值:</span><input type="number" id="DCOutputVI-input" value="' + element.singleOutput + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setDCOutputVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'KnobVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('请输入初始值&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">最小值:</span><input type="number" id="KnobVI-input-1" value="' + element.minValue + '" class="normalInput">' +
                '<span class="normalSpan">最大值:</span><input type="number" id="KnobVI-input-2" value="' + element.maxValue + '" class="normalInput">' +
                '<span class="normalSpan">初值:</span><input type="number" id="KnobVI-input-3" value="' + element.defaultValue + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setKnobVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'RotorExperimentalRigVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('请设置输出信号类型&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radioInput" name="RotorExperimentalRigVI-type" value="1" onclick="setRotorExperimentalRigVI(' + elementInfo[2] + ',this.value)">' +
                '<label class="input-label" for="type1">转速信号</label></div>' +
                '<div><input type="radio" id="type2" class="radioInput" name="RotorExperimentalRigVI-type" value="2" onclick="setRotorExperimentalRigVI(' + elementInfo[2] + ',this.value)">' +
                '<label class="input-label" for="type2">加速度信号</label></div>' +
                '<div><input type="radio" id="type3" class="radioInput" name="RotorExperimentalRigVI-type" value="3" onclick="setRotorExperimentalRigVI(' + elementInfo[2] + ',this.value)">' +
                '<label class="input-label" for="type3">轴心位移X信号</label></div>' +
                '<div><input type="radio" id="type4" class="radioInput" name="RotorExperimentalRigVI-type" value="4" onclick="setRotorExperimentalRigVI(' + elementInfo[2] + ',this.value)">' +
                '<label class="input-label" for="type4">轴心位移Y信号</label></div>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'RoundPanelVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('请设置初始参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">标题:</span><input type="text" id="RoundPanelVI-input-1" value="' + element.title + '" class="normalInput">' +
                '<span class="normalSpan">单位:</span><input type="text" id="RoundPanelVI-input-2" value="' + element.unit + '" class="normalInput">' +
                '<span class="normalSpan">最小值:</span><input type="number" id="RoundPanelVI-input-3" value="' + element.minValue + '" class="normalInput">' +
                '<span class="normalSpan">最大值:</span><input type="number" id="RoundPanelVI-input-4" value="' + element.maxValue + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setRoundPanelVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'ProportionResponseVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('比例响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="ProportionResponseVI-input" value="' + element.k1 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setProportionResponseVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'IntegrationResponseVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('积分响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K2:</span><input type="number" id="IntegrationResponseVI-input" value="' + element.k2 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setIntegrationResponseVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'DifferentiationResponseVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('微分响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K3:</span><input type="number" id="DifferentiationResponseVI-input" value="' + element.k3 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setDifferentiationResponseVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'InertiaResponseVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('惯性响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="InertiaResponseVI-input" value="' + element.k1 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setInertiaResponseVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'OscillationResponseVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('震荡响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="OscillationResponseVI-input-1" value="' + element.k1 + '" class="normalInput">' +
                '<span class="normalSpan">K2:</span><input type="number" id="OscillationResponseVI-input-2" value="' + element.k2 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setOscillationResponseVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'ProportionIntegrationResponseVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('比例积分响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="ProportionIntegrationResponseVI-input-1" value="' + element.k1 + '" class="normalInput">' +
                '<span class="normalSpan">K2:</span><input type="number" id="ProportionIntegrationResponseVI-input-2" value="' + element.k2 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setProportionIntegrationResponseVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'ProportionDifferentiationResponseVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('比例微分响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="ProportionDifferentiationResponseVI-input-1" value="' + element.k1 + '" class="normalInput">' +
                '<span class="normalSpan">K3:</span><input type="number" id="ProportionDifferentiationResponseVI-input-2" value="' + element.k3 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setProportionDifferentiationResponseVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'ProportionInertiaResponseVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('比例惯性响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="ProportionInertiaResponseVI-input-1" value="' + element.k1 + '" class="normalInput">' +
                '<span class="normalSpan">K2:</span><input type="number" id="ProportionInertiaResponseVI-input-2" value="' + element.k2 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="setProportionInertiaResponseVI(' + elementInfo[2] + ')">确定</button>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;

        case 'SignalGeneratorVI':

            dataSetBox[0] = true;
            dataSetBox[1] = G.box('请选择信号类型&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radioInput" name="SignalGeneratorVI-type" value="1" onclick="setSignalGeneratorVI(' + elementInfo[2] + ',this.value)">' +
                '<label class="input-label" for="type1">正弦波</label></div>' +
                '<div><input type="radio" id="type2" class="radioInput" name="SignalGeneratorVI-type" value="2" onclick="setSignalGeneratorVI(' + elementInfo[2] + ',this.value)">' +
                '<label class="input-label" for="type2">方波</label></div>' +
                '<div><input type="radio" id="type3" class="radioInput" name="SignalGeneratorVI-type" value="3" onclick="setSignalGeneratorVI(' + elementInfo[2] + ',this.value)">' +
                '<label class="input-label" for="type3">三角波</label></div>' +
                '<div><input type="radio" id="type4" class="radioInput" name="SignalGeneratorVI-type" value="4" onclick="setSignalGeneratorVI(' + elementInfo[2] + ',this.value)">' +
                '<label class="input-label" for="type4">白噪声</label></div>' +
                '</div>', 1, function () {
                    dataSetBox[0] = false;
                });
            break;
    }
}

function closeBox () {
    if (dataSetBox[0]) {
        dataSetBox[1].close();
    }
    if (inputSetBox[0]) {
        inputSetBox[1].close();
    }
    if (outputSetBox[0]) {
        outputSetBox[1].close();
    }
}

function setAddVI (elementNumber) {

    closeBox();

    dataObject.AddVI[elementNumber].setOriginalData(document.getElementById('AddVI-input').value);

    findTimerExecutor(dataObject.AddVI[elementNumber]);
}

function setPIDVI (elementNumber) {

    closeBox();
    dataObject.PIDVI[elementNumber].P = document.getElementById('PIDVI-input-1').value;
    dataObject.PIDVI[elementNumber].I = document.getElementById('PIDVI-input-2').value;
    dataObject.PIDVI[elementNumber].D = document.getElementById('PIDVI-input-3').value;

    findTimerExecutor(dataObject.PIDVI[elementNumber]);
}

function setTextVI (elementNumber) {

    closeBox();

    dataObject.TextVI[elementNumber].setDecimalPlace(document.getElementById('TextVI-input').value);

    findTimerExecutor(dataObject.TextVI[elementNumber]);
}

function setDCOutputVI (elementNumber) {

    closeBox();

    dataObject.DCOutputVI[elementNumber].setData(document.getElementById('DCOutputVI-input').value);

    findTimerExecutor(dataObject.DCOutputVI[elementNumber]);
}

function setKnobVI (elementNumber) {

    closeBox();

    let minValue = Number(document.getElementById('KnobVI-input-1').value);
    let maxValue = Number(document.getElementById('KnobVI-input-2').value);
    let defaultValue = Number(document.getElementById('KnobVI-input-3').value);

    dataObject.KnobVI[elementNumber].setDataRange(minValue, maxValue, defaultValue);

    findTimerExecutor(dataObject.KnobVI[elementNumber]);
}

function setRotorExperimentalRigVI (elementNumber, type) {

    closeBox();

    dataObject.RotorExperimentalRigVI[elementNumber].signalType = type;

    findTimerExecutor(dataObject.RotorExperimentalRigVI[elementNumber]);
}

function setRoundPanelVI (elementNumber) {

    closeBox();

    let title = document.getElementById('RoundPanelVI-input-1').value;
    let unit = document.getElementById('RoundPanelVI-input-2').value;
    let minValue = document.getElementById('RoundPanelVI-input-3').value;
    let maxValue = document.getElementById('RoundPanelVI-input-4').value;

    dataObject.RoundPanelVI[elementNumber].setRange(minValue, maxValue, unit, title);

    findTimerExecutor(dataObject.RoundPanelVI[elementNumber]);
}

/**
 * 比例
 */
function setProportionResponseVI (elementNumber) {

    closeBox();

    dataObject.ProportionResponseVI[elementNumber].k1 = document.getElementById('ProportionResponseVI-input').value;

    findTimerExecutor(dataObject.ProportionResponseVI[elementNumber]);
}

/**
 * 积分
 */
function setIntegrationResponseVI (elementNumber) {

    closeBox();

    dataObject.IntegrationResponseVI[elementNumber].k2 = document.getElementById('IntegrationResponseVI-input').value;

    findTimerExecutor(dataObject.IntegrationResponseVI[elementNumber]);
}

/**
 * 微分
 */
function setDifferentiationResponseVI (elementNumber) {

    closeBox();

    dataObject.DifferentiationResponseVI[elementNumber].k3 = document.getElementById('DifferentiationResponseVI-input').value;

    findTimerExecutor(dataObject.DifferentiationResponseVI[elementNumber]);
}

/**
 * 惯性
 */
function setInertiaResponseVI (elementNumber) {

    closeBox();

    dataObject.InertiaResponseVI[elementNumber].k1 = document.getElementById('InertiaResponseVI-input').value;

    findTimerExecutor(dataObject.InertiaResponseVI[elementNumber]);
}

/**
 * 震荡
 */
function setOscillationResponseVI (elementNumber) {

    closeBox();

    dataObject.OscillationResponseVI[elementNumber].k1 = document.getElementById('OscillationResponseVI-input-1').value;
    dataObject.OscillationResponseVI[elementNumber].k2 = document.getElementById('OscillationResponseVI-input-2').value;

    findTimerExecutor(dataObject.OscillationResponseVI[elementNumber]);
}

/**
 * 比例积分
 */
function setProportionIntegrationResponseVI (elementNumber) {

    closeBox();

    dataObject.ProportionIntegrationResponseVI[elementNumber].k1 = document.getElementById('ProportionIntegrationResponseVI-input-1').value;
    dataObject.ProportionIntegrationResponseVI[elementNumber].k2 = document.getElementById('ProportionIntegrationResponseVI-input-2').value;

    findTimerExecutor(dataObject.ProportionIntegrationResponseVI[elementNumber]);
}

/**
 * 比例微分
 */
function setProportionDifferentiationResponseVI (elementNumber) {

    closeBox();

    dataObject.ProportionDifferentiationResponseVI[elementNumber].k1 = document.getElementById('ProportionDifferentiationResponseVI-input-1').value;
    dataObject.ProportionDifferentiationResponseVI[elementNumber].k3 = document.getElementById('ProportionDifferentiationResponseVI-input-2').value;

    findTimerExecutor(dataObject.ProportionDifferentiationResponseVI[elementNumber]);
}

/**
 * 比例惯性
 */
function setProportionInertiaResponseVI (elementNumber) {

    closeBox();

    dataObject.ProportionInertiaResponseVI[elementNumber].k1 = document.getElementById('ProportionInertiaResponseVI-input-1').value;
    dataObject.ProportionInertiaResponseVI[elementNumber].k2 = document.getElementById('ProportionInertiaResponseVI-input-2').value;

    findTimerExecutor(dataObject.ProportionInertiaResponseVI[elementNumber]);
}

/**
 * 信号发生器
 */
function setSignalGeneratorVI (elementNumber, type) {

    closeBox();

    dataObject.SignalGeneratorVI[elementNumber].signalType = type;

    findTimerExecutor(dataObject.SignalGeneratorVI[elementNumber]);
}

/**
 * 寻找用于启用Timer的VI
 */
function findTimerExecutor (element) {

    if (element.runningFlag) {

        return;
    }
    if (element.source !== undefined && element.source.length === 0) {

        return;
    }
    if (element.target !== undefined && element.target.length === 0) {

        return;
    }
    let runningElementArr = [];
    mainTimer = window.setInterval(function () {
        onTimer(element, runningElementArr);
    }, 50);
}

/**
 * Timer函数
 * @param element   启动Timer的VI
 *@param runningElementArr    用来存储是否需要刷新数据标志
 */
function onTimer (element, runningElementArr) {

    let i;
    for (i = 0; i < runningElementArr.length; i++) {

        if (!runningElementArr[i].runningFlag) {

            return;//循环未完成
        }
    }
    for (i = 0; i < runningElementArr.length; i++) {

        runningElementArr[i].runningFlag = false;
    }

    findSourceElement(element, runningElementArr);
    findTargetElement(element, runningElementArr);
}

function findSourceElement (element, runningElementArr) {

    let i;
    //添加element.runningFlag到标志位存储数组中
    if (runningElementArr) {

        if (runningElementArr.indexOf(element) == -1) {

            runningElementArr.push(element);
        }
    }

    if (element.source == undefined) {

        if (!element.runningFlag) {

            if (element.name == 'DCOutputVI') {

                element.setData(element.singleOutput);  //直流输出等无输入接口VI，直接重复赋值以生成输出数组
            }
            element.runningFlag = true;
        }

        return false;
    }
    else if (element.source.length === 0) {

        if (!element.runningFlag) {

            window.clearInterval(mainTimer);
            G.alert('连接缺失，请重试！', 1, 1500);
            for (i = 0; i < runningElementArr.length; i++) {

                runningElementArr[i].runningFlag = false;
                runningElementArr[i].reset();
            }
        }

        return false;
    }
    else {

        for (i = 0; i < element.source.length; i++) {

            if (!element.runningFlag) {

                let j, sourceData;
                //查找element对应的输入VI的输出参数
                for (j = 0; j < element.source[i][0].target.length; j++) {

                    if (element.source[i][0].target[j][0] == element) {

                        sourceData = getOutput(element.source[i][0], element.source[i][0].target[j][1]);
                        break;
                    }
                }

                setElementData(element, sourceData, element.source[i][1]);

                findSourceElement(element.source[i][0], runningElementArr);    //继续向前查找sourceVI
                findTargetElement(element.source[i][0], runningElementArr);    //同时也向后查找当前sourceVI对应的其他targetVI
            }
        }
    }
}

function findTargetElement (element, runningElementArr) {

    let i;
    if (element.target == undefined) {

        return false;
    }
    else if (element.target.length === 0) {

        window.clearInterval(mainTimer);
        G.alert('连接缺失，请重试！', 1, 1500);
        for (i = 0; i < runningElementArr.length; i++) {

            runningElementArr[i].runningFlag = false;
            runningElementArr[i].reset();
        }
        return false;
    }
    else {

        for (i = 0; i < element.target.length; i++) {

            //添加element到标志位存储数组中
            if (runningElementArr) {

                if (runningElementArr.indexOf(element.target[i][0]) === -1) {

                    runningElementArr.push(element.target[i][0]);
                }
            }
            if (!element.target[i][0].runningFlag) {

                let j, sourceDataType;
                //查找element.target的输入参数类型
                for (j = 0; j < element.target[i][0].source.length; j++) {

                    if (element.target[i][0].source[j][0] == element) {

                        sourceDataType = element.target[i][0].source[j][1];
                        break;
                    }
                }
                let sourceData = getOutput(element, element.target[i][1]);

                setElementData(element.target[i][0], sourceData, sourceDataType);

                findTargetElement(element.target[i][0], runningElementArr);    //继续向后查找targetVI
                findSourceElement(element.target[i][0], runningElementArr);    //同时向前查找当前targetVI对应的不同的sourceVI
            }
        }
    }
}

function setElementData (element, sourceData, sourceDataType) {

    if (element.name == 'AddVI') {

        if (sourceDataType == '1') {

            element.setOriginalData(sourceData);
            element.originalInputSetFlag = true;
        }
        else if (sourceDataType == '2') {

            element.setData(sourceData);
            element.lastInputSetFlag = true;
        }
        if (element.originalInputSetFlag && element.lastInputSetFlag) {

            element.runningFlag = true;
            element.originalInputSetFlag = false;
            element.lastInputSetFlag = false;
        }
    }
    else if (element.name == 'SignalGeneratorVI') {
        if (sourceDataType == '1') {

            element.amp = sourceData;
            element.ampSetFlag = true;
        }
        else if (sourceDataType == '2') {

            element.frequency = sourceData;
            element.frequencySetFlag = true;
        }
        if (element.ampSetFlag && element.frequencySetFlag) {

            element.phase += 10;
            element.setData(element.amp, element.frequency, element.phase);
            element.runningFlag = true;
            element.ampSetFlag = false;
            element.frequencySetFlag = false;
        }
    }
    else {

        element.setData(sourceData);
        element.runningFlag = true;
    }
}

function getOutput (element, outputType) {

    if (element.name == 'BallBeamVI') {

        if (outputType == 1) {

            return element.angelOutput;  //输出角度数组
        }
        else if (outputType == 2) {

            return element.positionOutput;  //输出位置数组

        }
        else if (outputType == 3) {

            return element.markPosition;  //输出标记位置
        }
    }
    else if (element.name == 'RotorExperimentalRigVI') {

        if (outputType == 1) {

            return element.signalOutput;  //输出时域信号

        }
        else if (outputType == 2) {

            return element.frequencyOutput;  //输出频域信号

        }
        else if (outputType == 3) {

            return element.orbitOutput;  //输出轴心位置

        }
        else if (outputType == 4) {

            return element.rotateFrequency;  //输出旋转频率

        }
    }
    else {

        return element.output;  //输出数组
    }
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
    let newVICanvas = document.createElement('canvas');
    for (let i = 0; i < VICanvas.attributes.length - 3; i++) {
        newVICanvas.setAttribute(VICanvas.attributes.item(i).nodeName, VICanvas.getAttribute(VICanvas.attributes.item(i).nodeName));
    }
    switch (VICanvas.id.split('-')[0]) {

        case 'AddVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.AddVICount++;
            break;

        case 'AudioVI':
            if (dataObject.AudioVI > 0) {
                G.alert('麦克风已添加！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.AudioVICount++;
            break;

        case 'BallBeamVI':
            if (dataObject.BallBeamVICount > 0) {
                G.alert('球杆实验已添加！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.BallBeamVICount++;
            break;

        case 'ButtonVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.ButtonVICount++;
            break;

        case 'WaveVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.WaveVICount++;
            break;

        case 'TextVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.TextVICount++;
            break;

        case 'DCOutputVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.DCOutputVICount++;
            break;

        case 'FFTVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.FFTVICount++;
            break;

        case 'KnobVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.KnobVICount++;
            break;

        case 'OrbitWaveVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.OrbitWaveVICount++;
            break;

        case 'PIDVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.PIDVICount++;
            break;

        case 'RelayVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.RelayVICount++;
            break;

        case 'RotorExperimentalRigVI':
            if (dataObject.RotorExperimentalRigVICount > 0) {
                G.alert('转子实验台已添加！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.RotorExperimentalRigVICount++;
            break;

        case 'RoundPanelVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.RoundPanelVICount++;
            break;

        case 'ProportionResponseVI':
            if (dataObject.ProportionResponseVICount > 0) {
                G.alert('比例响应已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ProportionResponseVICount++;
            break;

        case 'IntegrationResponseVI':
            if (dataObject.IntegrationResponseVICount > 0) {
                G.alert('积分响应已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.IntegrationResponseVICount++;
            break;

        case 'DifferentiationResponseVI':
            if (dataObject.DifferentiationResponseVICount > 0) {
                G.alert('微分响应已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.DifferentiationResponseVICount++;
            break;

        case 'InertiaResponseVI':
            if (dataObject.InertiaResponseVICount > 0) {
                G.alert('惯性响应已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.InertiaResponseVICount++;
            break;

        case 'OscillationResponseVI':
            if (dataObject.OscillationResponseVICount > 0) {
                G.alert('震荡响应已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.OscillationResponseVICount++;
            break;

        case 'ProportionIntegrationResponseVI':
            if (dataObject.ProportionIntegrationResponseVICount > 0) {
                G.alert('比例积分响应已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ProportionIntegrationResponseVICount++;
            break;

        case 'ProportionDifferentiationResponseVI':
            if (dataObject.ProportionDifferentiationResponseVICount > 0) {
                G.alert('比例微分响应已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ProportionDifferentiationResponseVICount++;
            break;

        case 'ProportionInertiaResponseVI':
            if (dataObject.ProportionInertiaResponseVICount > 0) {
                G.alert('比例惯性响应已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ProportionInertiaResponseVICount++;
            break;

        case 'SignalGeneratorVI':
            if (dataObject.SignalGeneratorVICount > 0) {
                G.alert('信号发生器已存在！', 1, 1500);
                return;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.SignalGeneratorVICount++;
            break;
    }
    newVICanvas.setAttribute('oncontextmenu', 'toggleDrag(event, this)');
    newVICanvas.width = VICanvas.width * VICanvas.getAttribute('zoom');
    newVICanvas.height = VICanvas.height * VICanvas.getAttribute('zoom');
    newVICanvas.style.left = (e.offsetX - newVICanvas.width / 2) + 'px';
    newVICanvas.style.top = (e.offsetY - newVICanvas.height / 2) + 'px';
    VIDraw(newVICanvas);
}

function VIDraw (canvas) {

    instance.getContainer().appendChild(canvas);
    instance.draggable(canvas);
    let elementInfo = canvas.id.split('-');
    switch (elementInfo[0]) {

        case 'AddVI':
            dataObject.AddVI.push(new VILibrary.VI.AddVI(canvas));
            addEndpoints(canvas.id, -1, 2);
            break;

        case 'AudioVI':
            dataObject.AudioVI.push(new VILibrary.VI.AudioVI(canvas));
            addEndpoints(canvas.id, -1, 0);
            break;

        case 'BallBeamVI':
            dataObject.BallBeamVI.push(new VILibrary.VI.BallBeamVI(canvas, true));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'ButtonVI':
            dataObject.ButtonVI.push(new VILibrary.VI.ButtonVI(canvas, true));
            addEndpoints(canvas.id, 0, 1);
            break;

        case 'DCOutputVI':
            dataObject.DCOutputVI.push(new VILibrary.VI.DCOutputVI(canvas));
            addEndpoints(canvas.id, -1, 0);
            break;

        case 'DifferentiationResponseVI':
            dataObject.DifferentiationResponseVI.push(new VILibrary.VI.DifferentiationResponseVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'FFTVI':
            dataObject.FFTVI.push(new VILibrary.VI.FFTVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'InertiaResponseVI':
            dataObject.InertiaResponseVI.push(new VILibrary.VI.InertiaResponseVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'IntegrationResponseVI':
            dataObject.IntegrationResponseVI.push(new VILibrary.VI.IntegrationResponseVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'KnobVI':
            dataObject.KnobVI.push(new VILibrary.VI.KnobVI(canvas));
            addEndpoints(canvas.id, -1, 0);
            break;

        case 'OrbitWaveVI':
            dataObject.OrbitWaveVI.push(new VILibrary.VI.OrbitWaveVI(canvas));
            addEndpoints(canvas.id, 0, 1);
            break;

        case 'OscillationResponseVI':
            dataObject.OscillationResponseVI.push(new VILibrary.VI.OscillationResponseVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'PIDVI':
            dataObject.PIDVI.push(new VILibrary.VI.PIDVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'ProportionDifferentiationResponseVI':
            dataObject.ProportionDifferentiationResponseVI.push(new VILibrary.VI.ProportionDifferentiationResponseVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'ProportionInertiaResponseVI':
            dataObject.ProportionInertiaResponseVI.push(new VILibrary.VI.ProportionInertiaResponseVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'ProportionIntegrationResponseVI':
            dataObject.ProportionIntegrationResponseVI.push(new VILibrary.VI.ProportionIntegrationResponseVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'ProportionResponseVI':
            dataObject.ProportionResponseVI.push(new VILibrary.VI.ProportionResponseVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'RelayVI':
            dataObject.RelayVI.push(new VILibrary.VI.RelayVI(canvas));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'RotorExperimentalRigVI':
            dataObject.RotorExperimentalRigVI.push(new VILibrary.VI.RotorExperimentalRigVI(canvas, true));
            addEndpoints(canvas.id, -1, 1);
            break;

        case 'RoundPanelVI':
            dataObject.RoundPanelVI.push(new VILibrary.VI.RoundPanelVI(canvas));
            addEndpoints(canvas.id, 0, 1);
            break;

        case 'SignalGeneratorVI':
            dataObject.SignalGeneratorVI.push(new VILibrary.VI.SignalGeneratorVI(canvas));
            addEndpoints(canvas.id, -1, 2);
            break;

        case 'TextVI':
            dataObject.TextVI.push(new VILibrary.VI.TextVI(canvas));
            dataObject.TextVI[dataObject.TextVICount - 1].setData(0);
            addEndpoints(canvas.id, 0, 1);
            break;

        case 'WaveVI':
            dataObject.WaveVI.push(new VILibrary.VI.WaveVI(canvas));
            addEndpoints(canvas.id, 0, 1);
            break;
    }
}

/**
 *添加节点
 * @param id 元素ID
 * @param sourcePointCount 输出节点允许最大连接数
 * @param targetPointCount 输入节点允许最大连接数
 */
function addEndpoints (id, sourcePointCount, targetPointCount) {

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
        // the definition of source endpoints (the small blue ones)
        sourceEndpoint = {
            endpoint: 'Dot',
            paintStyle: {
                stroke: '#7AB02C',
                fill: 'transparent',
                radius: 7,
                strokeWidth: 1
            },
            isSource: true,
            maxConnections: sourcePointCount, //设置最大连接个数，-1为不限制
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
        // the definition of target endpoints (will appear when the user drags a connection)
        targetEndpoint = {
            endpoint: 'Dot',
            paintStyle: {fill: '#7AB02C', radius: 7},
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: targetPointCount,
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
        sourceAnchors = [
            [0.2, 0, 0, -1, 0, 0, "foo"],
            [1, 0.2, 1, 0, 0, 0, "bar"],
            [0.8, 1, 0, 1, 0, 0, "baz"],
            [0, 0.8, -1, 0, 0, 0, "qux"]
        ],
        targetAnchors = [
            [0.6, 0, 0, -1],
            [1, 0.6, 1, 0],
            [0.4, 1, 0, 1],
            [0, 0.4, -1, 0]
        ];

    if (sourcePointCount != 0) {

        instance.addEndpoint(id, sourceEndpoint, {anchor: sourceAnchors, uuid: 'source-' + id});
    }
    if (targetPointCount != 0) {

        instance.addEndpoint(id, targetEndpoint, {anchor: targetAnchors, uuid: 'target-' + id});
    }
}

/**
 * 右键点击锁定VI
 * @param e
 * @param canvas
 */
function toggleDrag (e, canvas) {

    e = e || window.event;
    e.preventDefault(); //阻止右键默认菜单
    instance.toggleDraggable(canvas);
}

window.addEventListener('resize', containerResize, false);

function containerResize () {

    let height = document.documentElement.clientHeight * 0.95 > 600 ? document.documentElement.clientHeight * 0.95 : 600;
    sideBar.style.height = height + 'px';
    VIContainer.style.height = height + 'px';
}
