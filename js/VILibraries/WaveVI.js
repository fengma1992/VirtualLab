/**
 * Created by Fengma on 2016/10/9.
 */

/**
 *
 * @param domElement    HTML5中CANVAS对象
 * @constructor
 */
function WaveVI(domElement) {
    var _this = this;
    this.canvas = domElement;
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width; //对象宽度//
    this.height = this.canvas.height; //对象高度//
    //坐标单位//
    this.strLabelX = 'X';
    this.strLabelY = 'Y';

    //坐标数值//
    this.XMaxVal = 1024;
    this.XMinVal = 0;
    this.YMaxVal = 10;
    this.YMinVal = -10;
    this.autoZoom = true;

    //网格行列数//
    this.nRow = 5;
    this.nCol = 10;
    this.pointNum = 1024;
    this.borderWidth = 5;
    this.drawRulerFlag = true;

    //网格矩形四周边距 TOP RIGHT BOTTOM LEFT//
    this.offsetT = 5 + this.borderWidth;
    this.offsetR = 5 + this.borderWidth;
    this.offsetB = 30 + this.borderWidth;
    this.offsetL = 38 + this.borderWidth;
    this.waveWidth = this.width - this.offsetL - this.offsetR;
    this.waveHeight = this.height - this.offsetT - this.offsetB;

    //颜色选型//
    this.bgColor = "RGB(249, 250, 249)";
    this.screenColor = "RGB(61, 132, 185)";
    this.gridColor = "RGB(200, 200, 200)";
    this.fontColor = "RGB(0, 0, 0)";
    this.signalColor = "RGB(255, 255, 0)";
    this.rulerColor = "RGB(255, 255, 255)";

    //缓冲数组
    this.bufferVal = [];
    this.curPointX = this.offsetL;
    this.curPointY = this.offsetT;
    console.log('WaveVI.js version 0.1');

    this.Paint = function () {
        _this.DrawBackground();
        _this.DrawWave();
    };

    this.DrawWave = function () {

        var ratioX = _this.waveWidth / (_this.XMaxVal - _this.XMinVal);
        var ratioY = _this.waveHeight / (_this.YMaxVal - _this.YMinVal);
        var pointX = [];
        var pointY = [];

        var i;
        for (i = 0; i < _this.pointNum; i++) {
            pointX[i] = _this.offsetL + i * ratioX;
            pointY[i] = _this.offsetT + (_this.YMaxVal - _this.bufferVal[i]) * ratioY;
            if (pointY[i] < _this.offsetT) {
                pointY[i] = _this.offsetT;
            }
            if (pointY[i] > (_this.offsetT + _this.waveHeight)) {
                pointY[i] = _this.offsetT + _this.waveHeight;
            }
        }
        //绘制波形曲线
        _this.ctx.beginPath();
        _this.ctx.lineWidth = 4;
        _this.ctx.lineCap = "round";
        _this.ctx.strokeStyle = _this.signalColor;
        for (i = 1; i < _this.pointNum; i++) {
            _this.ctx.moveTo(pointX[i - 1], pointY[i - 1]);
            _this.ctx.lineTo(pointX[i], pointY[i]);
        }
        _this.ctx.stroke();
        _this.ctx.closePath();
        _this.ctx.save();
    };

    this.DrawBackground = function () {
        var ctx = _this.ctx;
        //刷背景//
        ctx.beginPath();
        /* 将这个渐变设置为fillStyle */
        // ctx.fillStyle = grad;
        ctx.fillStyle = _this.bgColor;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "RGB(25, 25, 25)";
        ctx.fillRect(0, 0, _this.width, _this.height);
        ctx.strokeRect(3, 3, _this.width - 6, _this.height - 6);
        ctx.closePath();

        //刷网格背景//
        //画网格矩形边框和填充
        ctx.beginPath();
        ctx.fillStyle = _this.screenColor;
        ctx.lineWidth = 1;
        ctx.strokeStyle = _this.gridColor;
        ctx.fillRect(_this.offsetL, _this.offsetT, _this.waveWidth, _this.waveHeight);
        ctx.strokeRect(_this.offsetL + 0.5, _this.offsetT + 0.5, _this.waveWidth, _this.waveHeight);
        ctx.closePath();

        var nRow = _this.nRow;
        var nCol = _this.nCol;
        var divX = _this.waveWidth / nCol;
        var divY = _this.waveHeight / nRow;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.strokeStyle = _this.gridColor;

        var i, j;
        //绘制横向网格线
        for (i = 1; i < nRow; i++) {
            ctx.moveTo(_this.offsetL, divY * i + _this.offsetT);
            ctx.lineTo(_this.width - _this.offsetR, divY * i + _this.offsetT);
        }
        //绘制纵向网格线
        for (j = 1; j < nCol; j++) {
            ctx.moveTo(divX * j + _this.offsetL, _this.offsetT);
            ctx.lineTo(divX * j + _this.offsetL, _this.height - _this.offsetB);
        }
        ctx.stroke();
        ctx.closePath();
        //////////////////////////////////////////////////////
        //绘制横纵刻度
        var scaleYNum = 10;
        var scaleXNum = 20;
        var scaleYStep = _this.waveHeight / scaleYNum;
        var scaleXStep = _this.waveWidth / scaleXNum;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = _this.fontColor;
        //画纵刻度
        var k;
        for (k = 1; k < scaleYNum; k++) {
            if (k % 2 == 0) {
                ctx.moveTo(_this.offsetL - 6, _this.offsetT + k * scaleYStep);
                ctx.lineTo(_this.offsetL, _this.offsetT + k * scaleYStep);
            }
            else {
                ctx.moveTo(_this.offsetL - 3, _this.offsetT + k * scaleYStep);
                ctx.lineTo(_this.offsetL, _this.offsetT + k * scaleYStep);
            }
        }
        //画横刻度
        for (k = 1; k < scaleXNum; k++) {
            if (k % 2 == 0) {
                ctx.moveTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight);
                ctx.lineTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight + 7);
            }
            else {
                ctx.moveTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight);
                ctx.lineTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight + 4);
            }
        }
        ctx.stroke();
        ctx.closePath();
        ////////////////画数字字体////////////////
        ctx.beginPath();
        ctx.font = "normal 14px Calibri";

        var strLab;
        //横标签//
        strLab = _this.strLabelX;
        ctx.fillText(strLab, _this.width - _this.offsetR - 5, _this.height - _this.offsetB + 20);

        //纵标签//
        strLab = _this.strLabelY;
        ctx.fillText(strLab, _this.offsetL - 25, _this.offsetT + 10);

        var xvalstep = (_this.XMaxVal - _this.XMinVal) / scaleXNum;
        var yvalstep = (_this.YMaxVal - _this.YMinVal) / scaleYNum;

        ctx.fillStyle = _this.fontColor;
        var temp = 0;
        //横坐标刻度//
        for (i = 2; i < scaleXNum; i += 4) {
            temp = _this.XMinVal + xvalstep * i;
            if (Math.abs(temp) >= 1000) {
                temp = temp / 1000;
                strLab = temp.toFixed(1).toString() + 'k';
            }
            else if (Math.abs(temp) < 1000 && Math.abs(temp) >= 100) {
                strLab = temp.toFixed(0).toString();
            }
            else if (Math.abs(temp) < 100 && Math.abs(temp) >= 10) {
                strLab = temp.toFixed(1).toString();
            }
            else if (Math.abs(temp) < 10) {
                strLab = temp.toFixed(2).toString();
            }
            ctx.fillText(strLab, _this.offsetL + scaleXStep * i - 9, _this.height - 10);
        }
        //纵坐标刻度//
        for (i = 2; i < scaleYNum; i += 2) {
            temp = _this.YMaxVal - yvalstep * i;
            if (Math.abs(temp) >= 1000) {
                temp = temp / 1000;
                strLab = temp.toFixed(1).toString() + 'k';
            }
            else if (Math.abs(temp) < 1000 && Math.abs(temp) >= 10) {
                strLab = temp.toFixed(0).toString();
            }
            else if (Math.abs(temp) < 10) {
                strLab = temp.toFixed(1).toString();
            }
            ctx.fillText(strLab, _this.offsetL - 35, _this.offsetT + scaleYStep * i + 5);
        }
        ctx.closePath();
        ctx.save();
    };

    this.DrawBackground();

    this.drawRuler = function () {
        _this.Paint();
        //画标尺//
        _this.ctx.beginPath();
        _this.ctx.lineWidth = 1;
        _this.ctx.lineCap = "round";
        _this.ctx.strokeStyle = _this.rulerColor;
        _this.ctx.font = "normal 14px Calibri";
        _this.ctx.fillStyle = _this.rulerColor;
        //竖标尺//
        _this.ctx.moveTo(_this.curPointX + 0.5, _this.offsetT);
        _this.ctx.lineTo(_this.curPointX + 0.5, _this.height - _this.offsetB);
        _this.ctx.stroke();
        var curPointX = ((_this.curPointX - _this.offsetL) * (_this.XMaxVal - _this.XMinVal) / _this.waveWidth).toFixed(0);
        var curPointY = parseFloat(_this.bufferVal[curPointX]).toFixed(2);
        _this.ctx.fillText(`(${curPointX}, ${curPointY})`, _this.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15);
        _this.ctx.closePath();
    };

    this.reset = function () {
        for (var i = 0; i < len; i++) {
            _this.bufferVal[i] = 0.0;
        }
        _this.Paint();
    };

    this.SetData = function (data, len) {
        _this.pointNum = len;
        _this.XMaxVal = len;
        var YMax = 0, YMin = 0;
        for (var i = 0; i < len; i++) {
            _this.bufferVal[i] = data[i];
            YMax = YMax < _this.bufferVal[i] ? _this.bufferVal[i] : YMax;
            YMin = YMin > _this.bufferVal[i] ? _this.bufferVal[i] : YMin;
        }
        if (_this.autoZoom) {
            if ((_this.YMaxVal <= YMax) || (_this.YMaxVal - YMax > 5 * (YMax - YMin))) {
                _this.YMaxVal = 2 * YMax - YMin;
                _this.YMinVal = 2 * YMin - YMax;
            }

            if ((_this.YMinVal >= YMin) || (YMin - _this.YMaxVal > 5 * (YMax - YMin))) {
                _this.YMaxVal = 2 * YMax - YMin;
                _this.YMinVal = 2 * YMin - YMax;
            }
        }
        _this.Paint();
    };

    this.SetAxisRangX = function (xMin, xNax) {
        _this.XMinVal = xMin;
        _this.XMaxVal = xNax;
        _this.Paint();
    };

    this.SetAxisRangY = function (yMin, yMax) {
        _this.YMinVal = yMin;
        _this.YMaxVal = yMax;
        _this.Paint();
    };

    this.SetPointNum = function (num) {
        _this.pointNum = num;
        _this.Paint();
    };

    this.SetRowColNum = function (row, col) {
        _this.nRow = row;
        _this.nCol = col;
        _this.Paint();
    };

    /**
     * 信号产生函数
     * @param type  信号类型
     * @param amp 信号幅值
     * @param f 信号频率
     * @param phase 信号相位
     * @param n 信号长度
     */
    this.SignalData = function (type, amp, f, phase, n) {
        var data = [];
        var LEN = n == undefined ? 1024 : n;
        var AMP = amp > 0 ? amp : 0;
        var FS = 11025;
        var i, j;
        var T = 1 / f;//周期
        var dt = 1 / FS;//采样周期
        var t, t1, t2, t3;

        if (f <= 0) {
            for (i = 0; i < LEN; i++) {
                data.push(0);
            }
            return data;
        }
        switch (type) {
            case 1://正弦波
                for (i = 0; i < LEN; i++) {
                    data.push(AMP * Math.sin(2 * Math.PI * f * i / FS + (2 * Math.PI * phase) / 360));
                }
                return data;

            case 2://方波
                t1 = T / 2;//半周期时长
                t3 = T * phase / 360.0;
                for (i = 0; i < LEN; i++) {
                    t = i * dt + t3;
                    t2 = t - Math.floor(t / T) * T;
                    if (t2 >= t1)
                        data.push(-AMP);
                    else
                        data.push(AMP);
                }
                return data;

            case 3://三角波
                t3 = T * phase / 360.0;
                for (i = 0; i < LEN; i++) {
                    t = i * dt + t3;
                    t2 = parseInt(t / T);
                    t1 = t - t2 * T;
                    if (t1 <= T / 2)
                        data.push(4 * AMP * t1 / T - AMP);
                    else
                        data.push(3 * AMP - 4 * AMP * t1 / T);
                }
                return data;

            case 4://白噪声
                t2 = 32767;// 0 -- 0x7fff
                for (i = 0; i < LEN; i++) {
                    t1 = 0;
                    for (j = 0; j < 12; j++)
                        t1 += (t2 * Math.random());
                    data.push(AMP * (t1 - 6 * t2) / (3 * t2));
                }
                return data;
        }
    };

    var _mouseOverFlag = false;
    var _mouseOutFlag = false;
    var _dragAndDropFlag = false;
    var _mouseUpFlag = false;
    var _onclickFlag = false;
    var _mouseMoveFlag = false;

    this.attachEvent = function (event, handler) {

        switch (event) {
            case 'mouseOver':
                this.mouseOver = handler;
                _mouseOverFlag = true;
                break;
            case 'mouseOut':
                this.mouseOut = handler;
                _mouseOutFlag = true;
                break;
            case 'dragAndDrop':
                this.dragAndDrop = handler;
                _dragAndDropFlag = true;
                break;
            case 'mouseUp':
                this.mouseUp = handler;
                _mouseUpFlag = true;
                break;
            case 'onclick':
                this.onclick = handler;
                _onclickFlag = true;
                break;
            case 'mouseMove':
                this.mouseMove = handler;
                _mouseMoveFlag = true;
                break;
                break;
        }
    };

    this.detachEvent = function (event) {

        switch (event) {
            case 'mouseOver':
                _mouseOverFlag = false;
                break;
            case 'mouseOut':
                _mouseOutFlag = false;
                break;
            case 'dragAndDrop':
                _dragAndDropFlag = false;
                break;
            case 'mouseUp':
                _mouseUpFlag = false;
                break;
            case 'onclick':
                _onclickFlag = false;
                break;
            case 'mouseMove':
                _mouseMoveFlag = false;
                break;
                break;
        }

    };

    function OnMouseMove(event) {
        if (!_this.drawRulerFlag)
            return;
        _this.curPointX = event.offsetX == undefined ? event.layerX : event.offsetX - 5;
        _this.curPointY = event.offsetY == undefined ? event.layerY : event.offsetY - 5;

        if (_this.curPointX <= _this.offsetL) {
            _this.curPointX = _this.offsetL;
        }
        if (_this.curPointX >= (_this.width - _this.offsetR)) {
            _this.curPointX = _this.width - _this.offsetR;
        }
        _this.drawRuler();
    }

    function onContainerMouseDown(event) {
    }


    function onContainerMouseUp(event) {
    }

    // this.canvas.addEventListener('mousedown', onContainerMouseDown, false);  // mouseDownListener
    this.canvas.addEventListener('mousemove', OnMouseMove, false);   // mouseMoveListener
    // this.canvas.addEventListener('mouseup', onContainerMouseUp, false);  // mouseUpListener
}








