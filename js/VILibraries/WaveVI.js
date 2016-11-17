﻿/**
 * Created by Fengma on 2016/10/9.
 */

/**
 *  数据显示控件  绘制一维波形图等
 * @param domElement    HTML5中CANVAS对象
 * @constructor
 */
function WaveVI(domElement) {

    'use strict';
    const _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'WaveVI';
    this.cnText = '波形控件';
    this.runningFlag = false;

    this.width = this.container.width; //内框宽度//
    this.height = this.container.height; //内框高度//
    //坐标单位//
    this.strLabelX = 'X';
    this.strLabelY = 'Y';

    //坐标数值//
    this.maxValX = 1023;
    this.minValX = 0;
    this.maxValY = 10;
    this.minValY = -10;
    this.autoZoom = true;

    //网格行列数//
    this.nRow = 4;
    this.nCol = 8;
    this.pointNum = 1023;
    this.drawRulerFlag = true;

    //网格矩形四周边距 TOP RIGHT BOTTOM LEFT//

    this.offsetT = 10;
    this.offsetR = 10;

    this.offsetB = 10;
    this.offsetL = 10;
    if ((_this.height >= 200) && (_this.width >= 200)) {

        _this.offsetB = 35;
        _this.offsetL = 42;
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
    this.bufferVal = [];
    this.curPointX = this.offsetL;
    this.curPointY = this.offsetT;

    //虚拟仪器中相连接的控件VI
    this.source = [];

    this.draw = function () {

        _this.drawBackground();
        _this.drawWave();
        if (_this.drawRulerFlag) {

            _this.drawRuler();
        }
    };

    this.drawWave = function () {

        let ratioX = _this.waveWidth / (_this.pointNum - 1);
        let ratioY = _this.waveHeight / (_this.maxValY - _this.minValY);
        let pointX = [];
        let pointY = [];

        let i;
        for (i = 0; i < _this.pointNum; i++) {

            pointX[i] = _this.offsetL + i * ratioX;
            pointY[i] = _this.offsetT + (_this.maxValY - _this.bufferVal[i]) * ratioY;
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
        _this.ctx.moveTo(pointX[0], pointY[0]);
        for (i = 1; i < _this.pointNum; i++) {

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

        if ((_this.height >= 200) && (_this.width >= 200)) {

            //绘制横纵刻度
            let scaleYNum = 8;
            let scaleXNum = 16;
            let scaleYStep = _this.waveHeight / scaleYNum;
            let scaleXStep = _this.waveWidth / scaleXNum;
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = _this.fontColor;
            //画纵刻度
            let k;
            for (k = 2; k < scaleYNum; k += 2) {


                ctx.moveTo(_this.offsetL - 6, _this.offsetT + k * scaleYStep);
                ctx.lineTo(_this.offsetL, _this.offsetT + k * scaleYStep);

            }
            //画横刻度
            for (k = 2; k < scaleXNum; k += 2) {


                ctx.moveTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight);
                ctx.lineTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight + 7);

            }
            ctx.stroke();
            ctx.closePath();
            ////////////////画数字字体////////////////
            ctx.font = "normal 12px Calibri";

            let strLab;
            //横标签//
            strLab = _this.strLabelX;
            ctx.fillText(strLab, _this.width - _this.offsetR - strLab.length * 6 - 10, _this.height - _this.offsetB + 20);

            //纵标签//
            strLab = _this.strLabelY;
            ctx.fillText(strLab, strLab.length * 6, _this.offsetT + 12);

            let xvalstep = (_this.maxValX - _this.minValX) / scaleXNum;
            let yvalstep = (_this.maxValY - _this.minValY) / scaleYNum;

            ctx.fillStyle = _this.fontColor;
            let temp = 0;
            //横坐标刻度//
            for (i = 2; i < scaleXNum; i += 2) {

                temp = _this.minValX + xvalstep * i;
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

                temp = _this.maxValY - yvalstep * i;
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
        let curPointX = ((_this.curPointX - _this.offsetL) * (_this.maxValX - _this.minValX) / _this.waveWidth).toFixed(2);
        let curPointY = parseFloat(_this.bufferVal[((_this.curPointX - _this.offsetL) * _this.pointNum / _this.waveWidth).toFixed(0)])
        .toFixed(2);
        _this.ctx.fillText('(' + curPointX + ',' + curPointY + ')',
            _this.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15);
        _this.ctx.closePath();
    };

    this.reset = function () {

        _this.bufferVal = [];
        _this.drawBackground();
    };

    this.setData = function (data, len) {

        if (len == undefined) {

            _this.pointNum = data.length > _this.pointNum ? data.length : _this.pointNum;
        }
        else {

            _this.pointNum = len;
        }
        let YMax = 0, YMin = 0, i;
        for (i = 0; i < _this.pointNum; i++) {

            _this.bufferVal[i] = data[i] == undefined ? 0 : data[i];
            YMax = YMax < _this.bufferVal[i] ? _this.bufferVal[i] : YMax;
            YMin = YMin > _this.bufferVal[i] ? _this.bufferVal[i] : YMin;
        }
        if (_this.autoZoom) {

            if ((_this.maxValY <= YMax) || (_this.maxValY - YMax > 5 * (YMax - YMin))) {

                _this.maxValY = 2 * YMax - YMin;
                _this.minValY = 2 * YMin - YMax;
            }
            if ((_this.minValY >= YMin) || (YMin - _this.maxValY > 5 * (YMax - YMin))) {

                _this.maxValY = 2 * YMax - YMin;
                _this.minValY = 2 * YMin - YMax;
            }
            if (YMax < 0.01 && YMin > -0.01) {

                _this.maxValY = 1;
                _this.minValY = -1;
            }
        }
        _this.draw();
    };

    this.setAxisRangX = function (xMin, xNax) {

        _this.minValX = xMin;
        _this.maxValX = xNax;
        _this.drawBackground();
    };

    this.setAxisRangY = function (yMin, yMax) {

        _this.minValY = yMin;
        _this.maxValY = yMax;
        _this.drawBackground();
    };

    this.setPointNum = function (num) {

        _this.pointNum = num;
        _this.drawBackground();
    };

    this.setLabel = function (xLabel, yLabel) {

        this.strLabelX = xLabel;
        this.strLabelY = yLabel;
        _this.drawBackground();
    };

    this.setRowColNum = function (row, col) {

        _this.nRow = row;
        _this.nCol = col;
        _this.drawBackground();
    };

    let _mouseOverFlag = false;
    let _mouseOutFlag = false;
    let _dragAndDropFlag = false;
    let _mouseUpFlag = false;
    let _onclickFlag = false;
    let _mouseMoveFlag = false;

    this.dragAndDrop = function () {
    };// this.container.style.cursor = 'move';
    this.mouseOver = function () {
    }; // this.container.style.cursor = 'pointer';
    this.mouseOut = function () {
    }; // this.container.style.cursor = 'auto';
    this.mouseUp = function () {
    }; // this.container.style.cursor = 'auto';
    this.mouseMove = function () {
    };
    this.onclick = function () {
    };

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
        }

    };

    function onMouseMove(event) {

        if (!_this.drawRulerFlag || _this.bufferVal.length === 0) {

            return;
        }
        _this.curPointX = event.offsetX === undefined ? event.layerX : event.offsetX - 1;
        _this.curPointY = event.offsetY === undefined ? event.layerY : event.offsetY - 1;

        if (_this.curPointX <= _this.offsetL) {
            _this.curPointX = _this.offsetL;
        }
        if (_this.curPointX >= (_this.width - _this.offsetR)) {
            _this.curPointX = _this.width - _this.offsetR;
        }
        _this.draw();
        if (_mouseMoveFlag) {
            _this.mouseMove();
        }
    }

    // this.container.addEventListener('mousedown', onContainerMouseDown, false);  // mouseDownListener
    this.container.addEventListener('mousemove', onMouseMove, false);   // mouseMoveListener
    // this.container.addEventListener('mouseup', onContainerMouseUp, false);  // mouseUpListener
}








