/**
 * Created by Fengma on 2016/11/17.
 */

'use strict';

const sideBar = $('#sideBar');
const VIContainer = $('#VIContainer');

let instance, mainTimer;
let bindInfoArr = [];//二维数组，第二维分别记录输出VI、输入VI
let setVIDataIndex = 0;
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
    SignalGeneratorVI: []
};

function checkIfTargetValueBound (targetElement, checkedValue) {

    let i;
    for (i = 0; i < targetElement.source.length; i += 1) {

        if (targetElement.source[i][1] == checkedValue) {
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

function checkIfThreeDVIStarted (threeDElement) {

    if (threeDElement.isStart) {

        findTimerExecutor(threeDElement);
    }
}

function getObjectVIById (id) {

    let VIInfo = id.split('-');
    switch (VIInfo[0]) {

        case 'AddVI':
            return dataObject.AddVI[VIInfo[1]];

        case 'AudioVI':
            return dataObject.AudioVI[VIInfo[1]];

        case 'BallBeamVI':
            return dataObject.BallBeamVI[VIInfo[1]];

        case 'ButtonVI':
            return dataObject.ButtonVI[VIInfo[1]];

        case 'DCOutputVI':
            return dataObject.DCOutputVI[VIInfo[1]];

        case 'FFTVI':
            return dataObject.FFTVI[VIInfo[1]];

        case 'KnobVI':
            return dataObject.KnobVI[VIInfo[1]];

        case 'OrbitWaveVI':
            return dataObject.OrbitWaveVI[VIInfo[1]];

        case 'PIDVI':
            return dataObject.PIDVI[VIInfo[1]];

        case 'RelayVI':
            return dataObject.RelayVI[VIInfo[1]];

        case 'RotorExperimentalRigVI':
            return dataObject.RotorExperimentalRigVI[VIInfo[1]];

        case 'RoundPanelVI':
            return dataObject.RoundPanelVI[VIInfo[1]];

        case 'TextVI':
            return dataObject.TextVI[VIInfo[1]];

        case 'ProportionResponseVI':
            return dataObject.ProportionResponseVI[VIInfo[1]];

        case 'IntegrationResponseVI':
            return dataObject.IntegrationResponseVI[VIInfo[1]];

        case 'DifferentiationResponseVI':
            return dataObject.DifferentiationResponseVI[VIInfo[1]];

        case 'InertiaResponseVI':
            return dataObject.InertiaResponseVI[VIInfo[1]];

        case 'OscillationResponseVI':
            return dataObject.OscillationResponseVI[VIInfo[1]];

        case 'ProportionIntegrationResponseVI':
            return dataObject.ProportionIntegrationResponseVI[VIInfo[1]];

        case 'ProportionDifferentiationResponseVI':
            return dataObject.ProportionDifferentiationResponseVI[VIInfo[1]];

        case 'ProportionInertiaResponseVI':
            return dataObject.ProportionInertiaResponseVI[VIInfo[1]];

        case 'SignalGeneratorVI':
            return dataObject.SignalGeneratorVI[VIInfo[1]];

        case 'WaveVI':
            return dataObject.WaveVI[VIInfo[1]];
    }
}

function showBox (VICanvas) {

    let canvasId = VICanvas.id;
    let VI = getObjectVIById(canvasId);

    switch (canvasId.split('-')[0]) {

        case 'AddVI':

            window.B = G.box('请输入初始值&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">初值:</span><input type="number" id="AddVI-input" value="' + VI.originalInput + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'PIDVI':

            window.B = G.box('请输入PID参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">P:</span><input type="number" id="PIDVI-input-1" value="' + VI.P + '" class="normalInput">' +
                '<span class="normalSpan">I:</span><input type="number" id="PIDVI-input-2" value="' + VI.I + '" class="normalInput">' +
                '<span class="normalSpan">D:</span><input type="number" id="PIDVI-input-3" value="' + VI.D + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'TextVI':

            window.B = G.box('请输入保留小数位数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<input type="number" id="TextVI-input" value="' + VI.decimalPlace + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'DCOutputVI':

            window.B = G.box('请设置输出值&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">初值:</span><input type="number" id="DCOutputVI-input" value="' + VI.singleOutput + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'KnobVI':

            window.B = G.box('请输入初始值&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">最小值:</span><input type="number" id="KnobVI-input-1" value="' + VI.minValue + '" class="normalInput">' +
                '<span class="normalSpan">最大值:</span><input type="number" id="KnobVI-input-2" value="' + VI.maxValue + '" class="normalInput">' +
                '<span class="normalSpan">初值:</span><input type="number" id="KnobVI-input-3" value="' + VI.defaultValue + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'RotorExperimentalRigVI':

            window.B = G.box('请设置输出信号类型&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radioInput" name="RotorExperimentalRigVI-type" value="1" onclick="B.close()">' +
                '<label class="input-label" for="type1">转速信号</label></div>' +
                '<div><input type="radio" id="type2" class="radioInput" name="RotorExperimentalRigVI-type" value="2" onclick="B.close()">' +
                '<label class="input-label" for="type2">加速度信号</label></div>' +
                '<div><input type="radio" id="type3" class="radioInput" name="RotorExperimentalRigVI-type" value="3" onclick="B.close()">' +
                '<label class="input-label" for="type3">轴心位移X信号</label></div>' +
                '<div><input type="radio" id="type4" class="radioInput" name="RotorExperimentalRigVI-type" value="4" onclick="B.close()">' +
                '<label class="input-label" for="type4">轴心位移Y信号</label></div>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'RoundPanelVI':

            window.B = G.box('请设置初始参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">标题:</span><input type="text" id="RoundPanelVI-input-1" value="' + VI.title + '" class="normalInput">' +
                '<span class="normalSpan">单位:</span><input type="text" id="RoundPanelVI-input-2" value="' + VI.unit + '" class="normalInput">' +
                '<span class="normalSpan">最小值:</span><input type="number" id="RoundPanelVI-input-3" value="' + VI.minValue + '" class="normalInput">' +
                '<span class="normalSpan">最大值:</span><input type="number" id="RoundPanelVI-input-4" value="' + VI.maxValue + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'ProportionResponseVI':

            window.B = G.box('比例响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="ProportionResponseVI-input" value="' + VI.k1 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'IntegrationResponseVI':

            window.B = G.box('积分响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K2:</span><input type="number" id="IntegrationResponseVI-input" value="' + VI.k2 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'DifferentiationResponseVI':

            window.B = G.box('微分响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K3:</span><input type="number" id="DifferentiationResponseVI-input" value="' + VI.k3 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'InertiaResponseVI':

            window.B = G.box('惯性响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="InertiaResponseVI-input" value="' + VI.k1 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'OscillationResponseVI':

            window.B = G.box('震荡响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="OscillationResponseVI-input-1" value="' + VI.k1 + '" class="normalInput">' +
                '<span class="normalSpan">K2:</span><input type="number" id="OscillationResponseVI-input-2" value="' + VI.k2 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'ProportionIntegrationResponseVI':

            window.B = G.box('比例积分响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="ProportionIntegrationResponseVI-input-1" value="' + VI.k1 + '" class="normalInput">' +
                '<span class="normalSpan">K2:</span><input type="number" id="ProportionIntegrationResponseVI-input-2" value="' + VI.k2 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'ProportionDifferentiationResponseVI':

            window.B = G.box('比例微分响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="ProportionDifferentiationResponseVI-input-1" value="' + VI.k1 + '" class="normalInput">' +
                '<span class="normalSpan">K3:</span><input type="number" id="ProportionDifferentiationResponseVI-input-2" value="' + VI.k3 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'ProportionInertiaResponseVI':

            window.B = G.box('比例惯性响应&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<span class="normalSpan">K1:</span><input type="number" id="ProportionInertiaResponseVI-input-1" value="' + VI.k1 + '" class="normalInput">' +
                '<span class="normalSpan">K2:</span><input type="number" id="ProportionInertiaResponseVI-input-2" value="' + VI.k2 + '" class="normalInput">' +
                '<button id="startBtn" class="normalBtn" onclick="B.close()">确定</button>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;

        case 'SignalGeneratorVI':

            window.B = G.box('请选择信号类型&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radioInput" name="SignalGeneratorVI-type" value="1" onclick="B.close()">' +
                '<label class="input-label" for="type1">正弦波</label></div>' +
                '<div><input type="radio" id="type2" class="radioInput" name="SignalGeneratorVI-type" value="2" onclick="B.close()">' +
                '<label class="input-label" for="type2">方波</label></div>' +
                '<div><input type="radio" id="type3" class="radioInput" name="SignalGeneratorVI-type" value="3" onclick="B.close()">' +
                '<label class="input-label" for="type3">三角波</label></div>' +
                '<div><input type="radio" id="type4" class="radioInput" name="SignalGeneratorVI-type" value="4" onclick="B.close()">' +
                '<label class="input-label" for="type4">白噪声</label></div>' +
                '</div>', 1, function () {

                    getObjectVIById(canvasId).setInitialData();
                });
            break;
    }
}

function setVIData (VI, sourceData, sourceDataType) {

    if (VI.name == 'AddVI') {

        if (sourceDataType == '1') {

            VI.setOriginalData(sourceData);
        }
        else if (sourceDataType == '2') {

            VI.setData(sourceData);
        }
    }
    else if (VI.name == 'SignalGeneratorVI') {
        if (sourceDataType == '1') {

            VI.amp = sourceData;
            VI.ampSetFlag = true;
        }
        else if (sourceDataType == '2') {

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

        if (outputType == 1) {

            return VI.angelOutput;  //输出角度数组
        }
        if (outputType == 2) {

            return VI.positionOutput;  //输出位置数组

        }
        if (outputType == 3) {

            return VI.markPosition;  //输出标记位置
        }
    }
    else if (VI.name === 'RotorExperimentalRigVI') {

        if (outputType == 1) {

            return VI.signalOutput;  //输出时域信号

        }
        if (outputType == 2) {

            return VI.frequencyOutput;  //输出频域信号

        }
        if (outputType == 3) {

            return VI.orbitOutput;  //输出轴心位置

        }
        if (outputType == 4) {

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

            if (bindInfoArr[setVIDataIndex][0].target[i][0] == bindInfoArr[setVIDataIndex][1]) {

                sourceData = getOutput(bindInfoArr[setVIDataIndex][0], bindInfoArr[setVIDataIndex][0].target[i][1]);
                break;
            }
        }

        //查找targetVI的输入参数类型
        for (i = 0; i < bindInfoArr[setVIDataIndex][1].source.length; i += 1) {

            if (bindInfoArr[setVIDataIndex][1].source[i][0] == bindInfoArr[setVIDataIndex][0]) {

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
    newVICanvas.setAttribute('oncontextmenu', 'toggleDrag(event, this)');
    newVICanvas.width = VICanvas.width * VICanvas.getAttribute('zoom');
    newVICanvas.height = VICanvas.height * VICanvas.getAttribute('zoom');
    newVICanvas.style.left = (e.offsetX - newVICanvas.width / 2) + 'px';
    newVICanvas.style.top = (e.offsetY - newVICanvas.height / 2) + 'px';

    switch (VICanvas.id) {

        case 'AddVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.AddVICount++;
            break;

        case 'AudioVI':
            if (dataObject.AudioVICount > 0) {
                G.alert('麦克风已添加！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.AudioVICount++;
            break;

        case 'BallBeamVI':
            if (dataObject.BallBeamVICount > 0) {
                G.alert('球杆实验已添加！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.BallBeamVICount++;
            break;

        case 'ButtonVI':
            if (dataObject.ButtonVICount > 0) {
                G.alert('开关已添加！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ButtonVICount++;
            newVICanvas.setAttribute('onclick', 'toggleStart(this)');//向开关绑定启动函数
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
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.RotorExperimentalRigVICount++;
            break;

        case 'RoundPanelVI':
            newVICanvas.id = VICanvas.id + '-' + dataObject.RoundPanelVICount++;
            break;

        case 'ProportionResponseVI':
            if (dataObject.ProportionResponseVICount > 0) {
                G.alert('比例响应已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ProportionResponseVICount++;
            break;

        case 'IntegrationResponseVI':
            if (dataObject.IntegrationResponseVICount > 0) {
                G.alert('积分响应已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.IntegrationResponseVICount++;
            break;

        case 'DifferentiationResponseVI':
            if (dataObject.DifferentiationResponseVICount > 0) {
                G.alert('微分响应已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.DifferentiationResponseVICount++;
            break;

        case 'InertiaResponseVI':
            if (dataObject.InertiaResponseVICount > 0) {
                G.alert('惯性响应已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.InertiaResponseVICount++;
            break;

        case 'OscillationResponseVI':
            if (dataObject.OscillationResponseVICount > 0) {
                G.alert('震荡响应已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.OscillationResponseVICount++;
            break;

        case 'ProportionIntegrationResponseVI':
            if (dataObject.ProportionIntegrationResponseVICount > 0) {
                G.alert('比例积分响应已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ProportionIntegrationResponseVICount++;
            break;

        case 'ProportionDifferentiationResponseVI':
            if (dataObject.ProportionDifferentiationResponseVICount > 0) {
                G.alert('比例微分响应已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ProportionDifferentiationResponseVICount++;
            break;

        case 'ProportionInertiaResponseVI':
            if (dataObject.ProportionInertiaResponseVICount > 0) {
                G.alert('比例惯性响应已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.ProportionInertiaResponseVICount++;
            break;

        case 'SignalGeneratorVI':
            if (dataObject.SignalGeneratorVICount > 0) {
                G.alert('信号发生器已存在！', 1, 1500);
                return false;
            }
            newVICanvas.id = VICanvas.id + '-' + dataObject.SignalGeneratorVICount++;
            break;
    }
    VIDraw(newVICanvas);
}

function VIDraw (canvas) {

    instance.getContainer().appendChild(canvas);
    instance.draggable(canvas);
    let VIInfo = canvas.id.split('-');
    switch (VIInfo[0]) {

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

function createCanvas (id, className, width, height, zoomValue, showBoxFlag) {

    let canvas = document.createElement('canvas');
    canvas.setAttribute('id', id);
    canvas.setAttribute('class', className);
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    if (showBoxFlag) {

        canvas.setAttribute('ondblclick', 'showBox(this)');
    }
    canvas.setAttribute('zoom', zoomValue);
    canvas.setAttribute('draggable', 'true');
    canvas.setAttribute('ondragstart', 'drag(event)');
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
            if (sourceElement.name == 'BallBeamVI') {

                window.O = G.box('请选择' + sourceElement.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="output-type" value="1" onclick="O.close()">' +
                    '<label class="input-label" for="type1">反馈角度</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="output-type" value="2" onclick="O.close()">' +
                    '<label class="input-label" for="type2">反馈位置</label></div>' +
                    '<div><input type="radio" id="type3" class="radioInput" name="output-type" value="3" onclick="O.close()">' +
                    '<label class="input-label" for="type3">标记位置</label></div>' +
                    '</div>',
                    1, function () {

                        let checkedValue = $('input[name=output-type]:checked').val();
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
            else if (sourceElement.name == 'RotorExperimentalRigVI') {

                window.O = G.box('请选择' + sourceElement.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
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

                        let checkedValue = $('input[name=output-type]:checked').val();
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
            if (targetElement.name == 'AddVI') {

                window.I = G.box('请选择' + targetElement.cnText + '输入参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="AddVI-type" value="1" alt="初值" onclick="I.close()">' +
                    '<label class="input-label" for="type1">初值</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="AddVI-type" value="2" alt="反馈值" onclick="I.close()">' +
                    '<label class="input-label" for="type2">反馈值</label></div>' +
                    '</div>',
                    1, function () {

                        let checkedRadio = $('input[name=AddVI-type]:checked');
                        let checkedValue = checkedRadio.val();
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
            else if (targetElement.name == 'SignalGeneratorVI') {

                window.I = G.box('请选择' + targetElement.cnText + '输入参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
                    '<div class="input-div">' +
                    '<div><input type="radio" id="type1" class="radioInput" name="SignalGeneratorVI-type" value="1" alt="幅值" onclick="I.close()">' +
                    '<label class="input-label" for="type1">幅值</label></div>' +
                    '<div><input type="radio" id="type2" class="radioInput" name="SignalGeneratorVI-type" value="2" alt="频率" onclick="I.close()">' +
                    '<label class="input-label" for="type2">频率</label></div>' +
                    '</div>',
                    1, function () {

                        let checkedRadio = $('input[name=SignalGeneratorVI-type]:checked');
                        let checkedValue = checkedRadio.val();
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

            let sourceElement = getObjectVIById(connectionInfo.connection.sourceId);
            let targetElement = getObjectVIById(connectionInfo.connection.targetId);

            let i;
            for (i = 0; i < sourceElement.target.length; i += 1) {

                if (sourceElement.target[i][0] == targetElement) {

                    sourceElement.target.splice(i, 1);
                    break;
                }
            }
            for (i = 0; i < targetElement.source.length; i += 1) {

                if (targetElement.source[i][0] == sourceElement) {

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