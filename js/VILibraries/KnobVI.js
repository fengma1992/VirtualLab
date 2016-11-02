/**
 * Created by Fengma on 2016/10/10.
 */

/**
 * 旋钮
 * @param domElement    HTML CANVAS
 * @constructor
 */
function KnobVI(domElement) {
    var _this = this;
    var spinnerFlag = false;
    var startX, startY, stopX, stopY;
    var roundCount = 0;

    this.minValue = 0;
    this.maxValue = 100;
    this.defaultValue = 100;
    this.ratio = (this.maxValue - this.minValue) / (Math.PI * 1.5);
    this.singleOutput = this.defaultValue;
    this.radian = (this.defaultValue - this.minValue) / this.ratio;
    this.canvas = domElement;
    this.ctx = this.canvas.getContext("2d");
    this.name = 'KnobVI';
    this.cnText = '旋钮';
    this.runningFlag = false;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [];
    this.outputCount = 2;

    this.width = this.canvas.width; //对象宽度//
    this.height = this.canvas.height; //对象高度//

    //虚拟仪器中相连接的控件VI
    this.target = [];


    var knob_Base = new Image(), knob_Spinner = new Image();
    knob_Base.src = "img/knob_Base.png";
    knob_Spinner.src = "img/knob_Spinner.png";

    knob_Base.onload = knob_Spinner.onload = function () {
        DrawSpinner();
    };
    knob_Base.onerror = knob_Spinner.onerror = function () {
        console.log('error');
    };

    /**
     *设置旋钮初始参数
     * @param minValue  最小值
     * @param maxValue  最大值
     * @param startValue  初值
     */
    this.setDataRange = function (minValue, maxValue, startValue) {

        _this.minValue = isNaN(minValue) ? 0 : minValue;
        _this.maxValue = isNaN(maxValue) ? 1 : maxValue;
        _this.defaultValue = isNaN(startValue) ? 0 : startValue;
        _this.ratio = (_this.maxValue - _this.minValue) / (Math.PI * 1.5);
        this.setData(_this.defaultValue);
        this.radian = (_this.defaultValue - _this.minValue) / _this.ratio;

        DrawSpinner();
    };

    this.setData = function (data) {

        if (isNaN(data)) {

            return false;
        }

        _this.singleOutput = data;

        var i = 0;
        if (_this.index == 0) {

            for (i = 0; i < _this.dataLength; i++) {

                _this.output[i] = 0;
            }
        }
        if (_this.index <= (_this.dataLength - 1)) {

            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {

                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }
    };

    this.reset = function () {

        _this.index = 0;
    };

    function DrawSpinner() {

        var xPos = _this.width / 2;
        var yPos = _this.height / 2;
        _this.ctx.clearRect(0, 0, _this.width, _this.height);
        _this.ctx.drawImage(knob_Base, 0, 0, _this.width, _this.height);
        _this.ctx.save();   //保存之前位置
        _this.ctx.translate(xPos, yPos);
        _this.ctx.rotate(_this.radian - 135 / 180 * Math.PI);  //旋转, 初始位置为左下角
        _this.ctx.translate(-xPos, -yPos);
        _this.ctx.drawImage(knob_Spinner, 0, 0, _this.width, _this.height);
        _this.ctx.restore();  //恢复之前位置
        _this.ctx.beginPath();
        _this.ctx.font = "normal 14px Calibri";
        _this.ctx.fillText(_this.minValue.toString(), 0, _this.height);
        _this.ctx.fillText(_this.maxValue.toString(), _this.width - 7 * _this.maxValue.toString().length, _this.height); //字体大小为14
        _this.ctx.closePath();
    }

    this.mouseMove = function () {
    }; // this.container.style.cursor = 'move';

    this.mouseUp = function () {
    };

    this.attachEvent = function (event, handler) {

        switch (event) {
            case 'mouseMove':
                this.mouseMove = handler;
                break;
            case 'mouseUp':
                this.mouseUp = handler;
                break;
        }
    };


    function onMouseDown(event) {

        var tempData = rotateAxis(event.offsetX - _this.width / 2, -(event.offsetY - _this.height / 2), 135);
        startX = tempData[0];
        startY = tempData[1];
        if ((startX * startX + startY * startY) <= _this.width / 2 * _this.width / 2 * 0.5)
            spinnerFlag = true;
    }

    function onMouseMove(event) {

        var tempData = rotateAxis(event.offsetX - _this.width / 2, -(event.offsetY - _this.height / 2), 135);
        stopX = tempData[0];
        stopY = tempData[1];
        if ((stopX * stopX + stopY * stopY) <= _this.width / 2 * _this.width / 2 * 0.5 && !spinnerFlag)
            _this.canvas.style.cursor = 'pointer';
        else if (!spinnerFlag)
            _this.canvas.style.cursor = 'auto';
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
            DrawSpinner();
            startX = stopX;
            startY = stopY;
            _this.mouseMove();
        }
    }

    function onMouseUp(event) {

        spinnerFlag = false;
        roundCount = 0;
        _this.mouseUp();
    }

    function calculateRadian(x1, y1, x2, y2) {
        // 直角的边长
        var x = x2 - x1;
        var y = y2 - y1;
        // 斜边长
        var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        // 余弦
        var cos = y / z;
        // 弧度
        var radian;
        if (x >= 0)
            radian = Math.acos(cos);
        else
            radian = Math.PI * 2 - Math.acos(cos);
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
        var radian = angle / 180 * Math.PI;
        return [Math.sin(radian) * y + Math.cos(radian) * x, Math.cos(radian) * y - Math.sin(radian) * x];
    }


    this.canvas.addEventListener('mousemove', onMouseMove, false);
    this.canvas.addEventListener('mousedown', onMouseDown, false);
    this.canvas.addEventListener('mouseup', onMouseUp, false);

}