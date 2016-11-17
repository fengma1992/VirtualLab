/**
 * Created by Fengma on 2016/11/10.
 */

'use strict';
function BarVI(domElement) {

    const _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'BarVI';
    this.cnText = '柱状图';
    this.runningFlag = false;

    //坐标数值//
    this.labelX = [];
    this.maxValY = 100;
    this.minValY = 0;
    this.autoZoom = true;

    this.pointNum = 100;
    this.drawRulerFlag = true;

    //网格矩形四周边距 TOP RIGHT BOTTOM LEFT//

    this.offsetT = 10;
    this.offsetR = 10;

    this.offsetB = 10;
    this.offsetL = 10;
    if ((_this.container.height >= 200) && (_this.container.width >= 200)) {

        _this.offsetB = 35;
        _this.offsetL = 42;
    }
    this.waveWidth = this.container.width - this.offsetL - this.offsetR;
    this.waveHeight = this.container.height - this.offsetT - this.offsetB;
    this.ratioX = this.waveWidth / this.pointNum;
    this.ratioY = this.waveHeight / (this.maxValY - this.minValY);

    //颜色选型//
    this.bgColor = "RGB(255, 255, 255)";
    this.screenColor = 'RGB(255,253,246)';
    this.gridColor = "RGB(204, 204, 204)";
    this.fontColor = "RGB(0, 0, 0)";
    this.signalColor = "RGB(255, 100, 100)";
    this.rulerColor = "RGB(255, 100, 100)";

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

    function drawRec(x, y, w, h) {

        _this.ctx.beginPath();
        _this.ctx.fillStyle = _this.signalColor;
        _this.ctx.fillRect(x, y, w, h);
        _this.ctx.closePath();
    }

    function fixNumber (num) {

        let strLab;
        if (Math.abs(num) >= 1000) {

            num = num / 1000;
            strLab = num.toFixed(1).toString() + 'k';
        }
        else if (Math.abs(num) < 1000 && Math.abs(num) >= 100) {

            strLab = num.toFixed(0).toString();
        }
        else if (Math.abs(num) < 100 && Math.abs(num) >= 10) {

            if (Math.abs(num) - Math.abs(num).toFixed(0) < 0.01) {

                strLab = num.toFixed(0).toString();
            }
            else {

                strLab = num.toFixed(1).toString();
            }
        }
        else if (Math.abs(num) < 10) {

            if (Math.abs(num) - Math.abs(num).toFixed(0) < 0.01) {

                strLab = num.toFixed(0).toString();
            }
            else {

                strLab = num.toFixed(2).toString();
            }
        }
        return strLab;
    }

    this.drawWave = function () {

        let i, barHeight, x, y;
        //绘制柱状图
        for (i = 0; i < _this.pointNum; i++) {

            x = _this.offsetL + i * _this.ratioX;
            barHeight = _this.bufferVal[i] * _this.ratioY;
            y = _this.offsetT + _this.waveHeight - barHeight;
            drawRec(x + 0.1 * _this.ratioX, y, _this.ratioX * 0.8, barHeight, true);
        }
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
        ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        ctx.strokeRect(3, 3, _this.container.width - 6, _this.container.height - 6);
        ctx.closePath();

        //画网格矩形边框和填充
        ctx.beginPath();
        ctx.fillStyle = _this.screenColor;
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'RGB(0, 0, 0)';
        ctx.fillRect(_this.offsetL, _this.offsetT, _this.waveWidth, _this.waveHeight);
        ctx.strokeRect(_this.offsetL, _this.offsetT, _this.waveWidth, _this.waveHeight);
        ctx.closePath();

        //网格行数
        let nRow = _this.container.height / 50;
        let divY = _this.waveHeight / nRow;

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.strokeStyle = _this.gridColor;

        let i;
        //绘制横向网格线
        for (i = 1; i < nRow; i++) {

            ctx.moveTo(_this.offsetL, divY * i + _this.offsetT);
            ctx.lineTo(_this.container.width - _this.offsetR, divY * i + _this.offsetT);
        }
        ctx.stroke();
        ctx.closePath();

        if ((_this.container.height >= 200) && (_this.container.width >= 200)) {

            //绘制横纵刻度
            let scaleYNum = _this.container.height / 50;
            let scaleXNum = _this.container.width / 50;
            let scaleYStep = _this.waveHeight / scaleYNum;
            let scaleXStep = _this.waveWidth / scaleXNum;
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = _this.fontColor;
            //画纵刻度
            let k;
            for (k = 2; k <= scaleYNum; k += 2) {

                ctx.moveTo(_this.offsetL - 6, _this.offsetT + k * scaleYStep);
                ctx.lineTo(_this.offsetL, _this.offsetT + k * scaleYStep);

            }
            // //画横刻度
            // for (k = 0; k < scaleXNum; k += 2) {
            //
            //
            //     ctx.moveTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight);
            //     ctx.lineTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight + 7);
            //
            // }
            ctx.stroke();
            ctx.closePath();
            ////////////////画数字字体////////////////
            ctx.font = "normal 12px Calibri";

            let valStepX = _this.pointNum / scaleXNum;
            let valStepY = (_this.maxValY - _this.minValY) / scaleYNum;

            ctx.fillStyle = _this.fontColor;
            let temp = 0;
            if (_this.labelX.length < _this.pointNum) {

                for (i = 0; i < _this.pointNum; i++) {

                    _this.labelX[i] = i;
                }
            }
            //横坐标刻度//
            for (i = 0; i < scaleXNum; i += 2) {

                temp = _this.labelX[parseInt(valStepX * i)];
                ctx.fillText(temp.toString(), _this.offsetL + scaleXStep * i - 9 + _this.ratioX / 2, _this.container.height - 10);
            }
            //纵坐标刻度//
            for (i = 2; i <= scaleYNum; i += 2) {

                temp = _this.maxValY - valStepY * i;

                ctx.fillText(fixNumber(temp), _this.offsetL - 35, _this.offsetT + scaleYStep * i + 5);
            }
            ctx.closePath();
            ctx.save();
        }
    };

    this.drawBackground();

    this.drawRuler = function () {

        //是否缝隙间不绘制标尺
        // if ((_this.curPointX + 0.1 * _this.ratioX - _this.offsetL ) % _this.ratioX < 0.2 * _this.ratioX) {
        //
        //     return;
        // }

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
        _this.ctx.lineTo(_this.curPointX + 0.5, _this.container.height - _this.offsetB);
        _this.ctx.stroke();
        let curPointX = ((_this.curPointX - _this.offsetL + _this.ratioX / 2) * _this.pointNum / _this.waveWidth).toFixed(0) - 1;
        let curPointY = fixNumber(_this.bufferVal[curPointX]);
        _this.ctx.fillText('(' + _this.labelX[curPointX] + ',' + curPointY + ')',
            _this.container.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15);
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

            _this.setAxisRangY(YMin, 1.2 * YMax);
        }
        _this.ratioX = _this.waveWidth / _this.pointNum;
        _this.ratioY = _this.waveHeight / (_this.maxValY - _this.minValY);
        _this.draw();
    };

    this.setAxisRangY = function (yMin, yMax) {

        _this.minValY = yMin;
        _this.maxValY = yMax;
        _this.drawBackground();
    };

    this.setAxisX = function (labelX) {

        _this.labelX = labelX;
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

        if (!_this.drawRulerFlag || _this.bufferVal.length === 0) {

            return;
        }
        _this.curPointX = event.offsetX === undefined ? event.layerX : event.offsetX - 1;
        _this.curPointY = event.offsetY === undefined ? event.layerY : event.offsetY - 1;

        if (_this.curPointX <= _this.offsetL) {

            _this.curPointX = _this.offsetL;
        }
        if (_this.curPointX >= (_this.container.width - _this.offsetR)) {

            _this.curPointX = _this.container.width - _this.offsetR;
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