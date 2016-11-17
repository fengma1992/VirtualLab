/**
 * Created by Fengma on 2016/10/10.
 */

/**
 * 旋钮
 * @param domElement    HTML CANVAS
 * @constructor
 */
function KnobVI(domElement) {
    'use strict';
    const _this = this;
    let spinnerFlag = false;
    let startX, startY, stopX, stopY;
    let roundCount = 0;

    this.minValue = 0;
    this.maxValue = 100;
    this.defaultValue = 100;
    this.ratio = (this.maxValue - this.minValue) / (Math.PI * 1.5);
    this.singleOutput = this.defaultValue;
    this.radian = (this.defaultValue - this.minValue) / this.ratio;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'KnobVI';
    this.cnText = '旋钮';
    this.runningFlag = false;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.target = [];

    let knob_Base = new Image(), knob_Spinner = new Image();
    knob_Base.src = "img/knob_Base.png";
    knob_Spinner.src = "img/knob_Spinner.png";

    knob_Base.onload = function () {
        _this.draw();
    };
    knob_Spinner.onload = function () {
        _this.draw();
    };
    knob_Base.onerror = function (e) {
        console.log('error:' + e);
    };
    knob_Spinner.onerror = function (e) {
        console.log('error:' + e);
    };

    /**
     *设置旋钮初始参数
     * @param minValue  最小值
     * @param maxValue  最大值
     * @param startValue  初值
     */
    this.setDataRange = function (minValue, maxValue, startValue) {

        _this.minValue = Number.isNaN(minValue) ? 0 : minValue;
        _this.maxValue = Number.isNaN(maxValue) ? 1 : maxValue;
        _this.defaultValue = Number.isNaN(startValue) ? 0 : startValue;
        _this.ratio = (_this.maxValue - _this.minValue) / (Math.PI * 1.5);
        this.setData(_this.defaultValue);
        this.radian = (_this.defaultValue - _this.minValue) / _this.ratio;

        _this.draw();
    };

    this.setData = function (data) {

        if (Number.isNaN(data)) {

            return false;
        }

        _this.singleOutput = data;

        let i = 0;
        // if (_this.index == 0) {
        //
        //     for (i = 0; i < _this.dataLength; i++) {
        //
        //         _this.output[i] = 0;
        //     }
        // }
        if (_this.index <= (_this.dataLength - 1)) {

            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        }
        else {
            for (i = 0; i < _this.dataLength - 1; i++) {

                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }
    };

    this.reset = function () {

        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };

    this.draw = function () {

        let xPos = _this.container.width / 2;
        let yPos = _this.container.height / 2;
        _this.ctx.clearRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.drawImage(knob_Base, 0, 0, _this.container.width, _this.container.height);
        _this.ctx.save();   //保存之前位置
        _this.ctx.translate(xPos, yPos);
        _this.ctx.rotate(_this.radian - 135 / 180 * Math.PI);  //旋转, 初始位置为左下角
        _this.ctx.translate(-xPos, -yPos);
        _this.ctx.drawImage(knob_Spinner, 0, 0, _this.container.width, _this.container.height);
        _this.ctx.restore();  //恢复之前位置
        _this.ctx.beginPath();
        _this.ctx.font = "normal 14px Calibri";
        _this.ctx.fillText(_this.minValue.toString(), 0, _this.container.height);
        _this.ctx.fillText(_this.maxValue.toString(), _this.container.width - 7 * _this.maxValue.toString().length, _this.container.height); //字体大小为14
        _this.ctx.closePath();
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

    function onMouseDown(event) {

        let tempData = rotateAxis(event.offsetX - _this.container.width / 2, -(event.offsetY - _this.container.height / 2), 135);
        startX = tempData[0];
        startY = tempData[1];
        if ((startX * startX + startY * startY) <= _this.container.width / 2 * _this.container.width / 2 * 0.5) {

            spinnerFlag = true;
        }

    }

    function onMouseMove(event) {

        let tempData = rotateAxis(event.offsetX - _this.container.width / 2, -(event.offsetY - _this.container.height / 2), 135);
        stopX = tempData[0];
        stopY = tempData[1];
        if ((stopX * stopX + stopY * stopY) <= _this.container.width / 2 * _this.container.width / 2 * 0.5 && !spinnerFlag) {

            _this.container.style.cursor = 'pointer';
        }
        else if (!spinnerFlag) {

            _this.container.style.cursor = 'auto';
        }
        if (spinnerFlag) {

            if (startY > 0 && stopY > 0) {
                if (startX < 0 && stopX >= 0) {
                    roundCount++;
                }
                else if (startX > 0 && stopX <= 0) {
                    roundCount--;
                }
            }

            _this.radian = calculateRadian(0, 0, stopX, stopY) + Math.PI * 2 * roundCount;
            if (_this.radian < 0) {
                _this.radian = 0;
            }
            else if (_this.radian > 270 / 360 * 2 * Math.PI) {
                _this.radian = 270 / 180 * Math.PI;
            }
            _this.setData(_this.radian * _this.ratio + parseFloat(_this.minValue));
            _this.draw();
            startX = stopX;
            startY = stopY;

            if (_mouseMoveFlag) {

                _this.mouseMove();
            }
        }
    }

    function onMouseUp(event) {

        spinnerFlag = false;
        roundCount = 0;

        if (_mouseUpFlag) {

            _this.mouseUp();
        }
    }

    function calculateRadian(x1, y1, x2, y2) {
        // 直角的边长
        let x = x2 - x1;
        let y = y2 - y1;
        // 斜边长
        let z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        // 余弦
        let cos = y / z;
        // 弧度
        let radian;
        if (x >= 0) {
            radian = Math.acos(cos);
        }
        else {
            radian = Math.PI * 2 - Math.acos(cos);
        }
        return radian;
    }

    /**
     * 坐标系转换
     * @param x
     * @param y
     * @param angle
     * @returns {[x1, y1]}
     */
    function rotateAxis(x, y, angle) {
        let radian = angle / 180 * Math.PI;
        return [Math.sin(radian) * y + Math.cos(radian) * x, Math.cos(radian) * y - Math.sin(radian) * x];
    }

    this.container.addEventListener('mousemove', onMouseMove, false);
    this.container.addEventListener('mousedown', onMouseDown, false);
    this.container.addEventListener('mouseup', onMouseUp, false);

}