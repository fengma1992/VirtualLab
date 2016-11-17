/**
 * Created by Fengma on 2016/11/2.
 */

/**
 *  数据显示控件 绘制轨迹图
 * @param domElement    HTML5中CANVAS对象,最好为正方形
 * @constructor
 */
function OrbitWaveVI(domElement) {

    'use strict';
    const _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'OrbitWaveVI';
    this.cnText = '轨迹控件';
    this.runningFlag = false;

    this.width = this.container.width; //对象宽度//
    this.height = this.container.height; //对象高度//
    //坐标单位//
    this.strLabelX = 'X';
    this.strLabelY = 'Y';

    //坐标数值//
    this.MaxVal = 20;
    this.MinVal = -20;
    this.autoZoom = true;

    //网格行列数//
    this.nRow = 10;
    this.nCol = 10;
    this.pointNum = 0;
    this.borderWidth = 5;
    this.drawRulerFlag = true;

    //网格矩形四周边距 TOP RIGHT BOTTOM LEFT//
    this.offsetT = 5 + this.borderWidth;
    this.offsetR = 5 + this.borderWidth;

    this.offsetB = 5 + this.borderWidth;
    this.offsetL = 5 + this.borderWidth;
    if ((_this.height >= 200) && (_this.width >= 200)) {

        _this.offsetB = 25 + _this.borderWidth;
        _this.offsetL = 38 + _this.borderWidth;
    }
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

    this.bufferValX = [];
    this.bufferValY = [];
    this.curPointX = this.offsetL;
    this.curPointY = this.offsetT;

    //虚拟仪器中相连接的控件VI
    this.source = [];

    this.paint = function () {

        _this.drawBackground();
        _this.drawWave();
        if (_this.drawRulerFlag) {

            _this.drawRuler();
        }
    };

    this.drawWave = function () {

        let ratioX = _this.waveWidth / (_this.MaxVal - _this.MinVal);
        let ratioY = _this.waveHeight / (_this.MaxVal - _this.MinVal);
        let pointX = [];
        let pointY = [];

        let i;
        for (i = 0; i < _this.pointNum; i++) {

            pointX[i] = _this.offsetL + (_this.bufferValX[i] - _this.MinVal) * ratioX;
            pointY[i] = _this.offsetT + (_this.MaxVal - _this.bufferValY[i]) * ratioY;
            if (pointY[i] < _this.offsetT) {

                pointY[i] = _this.offsetT;
            }
            if (pointY[i] > (_this.offsetT + _this.waveHeight)) {

                pointY[i] = _this.offsetT + _this.waveHeight;
            }
        }
        //绘制波形曲线
        _this.ctx.beginPath();
        _this.ctx.lineWidth = 2;
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

    this.drawBackground = function () {

        let ctx = _this.ctx;
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

        let nRow = _this.nRow;
        let nCol = _this.nCol;
        let divX = _this.waveWidth / nCol;
        let divY = _this.waveHeight / nRow;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.strokeStyle = _this.gridColor;

        let i, j;
        //绘制横向网格线
        for (i = 1; i < nRow; i++) {
            if (i == 4) {

                ctx.lineWidth = 10;
            }
            else {

                ctx.lineWidth = 1;
            }
            ctx.moveTo(_this.offsetL, divY * i + _this.offsetT);
            ctx.lineTo(_this.width - _this.offsetR, divY * i + _this.offsetT);
        }
        //绘制纵向网格线
        for (j = 1; j < nCol; j++) {

            if (i == 4) {

                ctx.lineWidth = 10;
            }
            else {

                ctx.lineWidth = 1;
            }
            ctx.moveTo(divX * j + _this.offsetL, _this.offsetT);
            ctx.lineTo(divX * j + _this.offsetL, _this.height - _this.offsetB);
        }
        ctx.stroke();
        ctx.closePath();
        //////////////////////////////////////////////////////

        if ((_this.height >= 200) && (_this.width >= 200)) {
            //绘制横纵刻度
            let scaleYNum = 20;
            let scaleXNum = 20;
            let scaleYStep = _this.waveHeight / scaleYNum;
            let scaleXStep = _this.waveWidth / scaleXNum;
            ////////////////画数字字体////////////////
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = _this.fontColor;
            ctx.font = "normal 14px Calibri";

            let xValStep = (_this.MaxVal - _this.MinVal) / scaleXNum;
            let yValStep = (_this.MaxVal - _this.MinVal) / scaleYNum;

            ctx.fillStyle = _this.fontColor;
            let temp = 0;
            let strLab;
            //横坐标刻度//
            for (i = 2; i < scaleXNum; i += 4) {

                temp = _this.MinVal + xValStep * i;
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

                    strLab = temp.toFixed(1).toString();
                }
                ctx.fillText(strLab, _this.offsetL + scaleXStep * i - 9, _this.height - 10);
            }
            //纵坐标刻度//
            for (i = 2; i < scaleYNum; i += 4) {

                temp = _this.MaxVal - yValStep * i;
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

                    strLab = temp.toFixed(1).toString();
                }
                ctx.fillText(strLab, _this.offsetL - 30, _this.offsetT + scaleYStep * i + 5);
            }
            ctx.closePath();
            ctx.save();
        }
    };

    this.drawBackground();

    this.drawRuler = function () {

        if (_this.curPointX <= _this.offsetL) {

            return;
        }
        if (_this.curPointX >= (_this.container.width - _this.offsetR)) {

            return;
        }
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
        let i;
        let curPointX = ((_this.curPointX - _this.offsetL) * (_this.MaxVal - _this.MinVal) / _this.waveWidth + _this.MinVal).toFixed(1);
        let curPointY = [];
        for (i = 0; i < _this.pointNum; i++) {

            if (parseFloat(_this.bufferValX[i]).toFixed(1) === curPointX) {

                curPointY.push(parseFloat(_this.bufferValY[i]).toFixed(1));
                if (curPointY.length >= 5) {

                    break;
                }
            }
        }
        for (i = 0; i < curPointY.length; i++) {

            _this.ctx.fillText('(' + curPointX + ', ' + curPointY[i] + ')',
                _this.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15 + i * 15);
        }
        _this.ctx.closePath();
    };

    this.setData = function (dataX, dataY) {

        if ((dataX == null || undefined) || (dataY == null || undefined)) {

            return false;
        }

        _this.pointNum = dataX.length > dataY.length ? dataY.length : dataX.length; //取较短的数据长度
        if (Number.isNaN(_this.pointNum)) {

            return false;
        }
        let XMax = 0, XMin = 0, YMax = 0, YMin = 0;
        let i;
        for (i = 0; i < _this.pointNum; i++) {

            _this.bufferValY[i] = dataY[i] == undefined ? 0 : dataY[i];
            YMax = YMax < _this.bufferValY[i] ? _this.bufferValY[i] : YMax;
            YMin = YMin > _this.bufferValY[i] ? _this.bufferValY[i] : YMin;
        }
        for (i = 0; i < _this.pointNum; i++) {

            _this.bufferValX[i] = dataX[i] == undefined ? 0 : dataX[i];
            XMax = XMax < _this.bufferValX[i] ? _this.bufferValX[i] : XMax;
            XMin = XMin > _this.bufferValX[i] ? _this.bufferValX[i] : XMin;
        }
        if (_this.autoZoom) {

            let XYMax = YMax > XMax ? YMax : XMax;
            let XYMin = YMin > XMin ? XMin : YMin;
            if ((_this.MaxVal <= XYMax) || (_this.MaxVal - XYMax > 5 * (XYMax - XYMin))) {

                _this.MaxVal = 2 * XYMax - XYMin;
                _this.MinVal = 2 * XYMin - XYMax;
            }
            if ((_this.MinVal >= XYMin) || (XYMin - _this.MaxVal > 5 * (XYMax - XYMin))) {

                _this.MaxVal = 2 * XYMax - XYMin;
                _this.MinVal = 2 * XYMin - XYMax;
            }
            if (XYMax < 0.01 && XYMin > -0.01) {

                _this.MaxVal = 1;
                _this.MinVal = -1;
            }
        }
        _this.paint();
    };

    this.setAxisRange = function (min, max) {

        _this.MinVal = min;
        _this.MaxVal = max;
        _this.drawBackground();
    };

    this.setRowColNum = function (row, col) {

        _this.nRow = row;
        _this.nCol = col;
        _this.drawBackground();
    };

    this.reset = function () {
        let i;
        for (i = 0; i < _this.pointNum; i++) {

            _this.bufferValY[i] = 0.0;
            _this.bufferValX[i] = 0.0;
        }
        _this.drawBackground();
    };

    let _mouseOverFlag = false;
    let _mouseOutFlag = false;
    let _dragAndDropFlag = false;
    let _mouseUpFlag = false;
    let _onclickFlag = false;
    let _mouseMoveFlag = false;

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

    function onMouseMove(event) {
        if (!_this.drawRulerFlag || _this.bufferValY.length === 0) {

            return;
        }
        _this.curPointX = event.offsetX === undefined ? event.layerX : event.offsetX - 5;
        _this.curPointY = event.offsetY == undefined ? event.layerY : event.offsetY - 5;

        if (_this.curPointX <= _this.offsetL) {
            _this.curPointX = _this.offsetL;
        }
        if (_this.curPointX >= (_this.width - _this.offsetR)) {
            _this.curPointX = _this.width - _this.offsetR;
        }
        _this.paint();
    }

    this.container.addEventListener('mousemove', onMouseMove, false);   // mouseMoveListener
}








