/**
 * Created by Fengma on 2016/10/10.
 */

/**
 * 旋钮
 * @param domElement    HTML CANVAS
 * @param min   旋钮最小值
 * @param max   旋钮最大值
 * @param startValue    旋钮初始值
 * @constructor
 */
function KnobVI(domElement, minValue, maxValue, startValue) {
    var _this = this;
    var spinnerFlag = false;
    var startX, startY, stopX, stopY;
    var roundCount = 0;
    var min = isNaN(minValue) ? 0 : minValue;
    var max = isNaN(maxValue) ? 1 : maxValue;
    var defaultValue = isNaN(startValue) ? 0 : startValue;
    var ratio = (max - min) / (Math.PI * 1.5);

    this.data = defaultValue;
    this.radian = (defaultValue - min) / ratio;
    this.canvas = domElement;
    this.ctx = this.canvas.getContext("2d");
    this.name = 'KnobVI';
    this.cnText = '旋钮';

    this.width = this.canvas.width; //对象宽度//
    this.height = this.canvas.height; //对象高度//

    //虚拟仪器中相连接的控件VI
    this.target = [];

    this.canvas.addEventListener('mousemove', onMouseMove, false);
    this.canvas.addEventListener('mousedown', onMouseDown, false);
    this.canvas.addEventListener('mouseup', onMouseUp, false);

    var knob_Base = new Image(), knob_Spinner = new Image();
    knob_Base.src = "img/knob_Base.png";
    knob_Spinner.src = "img/knob_Spinner.png";

    knob_Base.onload = knob_Spinner.onload = function () {
        DrawSpinner();
    };
    knob_Base.onerror = knob_Spinner.onerror = function () {
        console.log('error');
    };
    this.getRadian = function () {
        return _this.radian;
    };


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
                break;
        }
    };

    this.setData = function (data) {
        _this.data = data > max ? max : data;
        _this.radian = (data - min) / ratio;
        DrawSpinner();
    };

    function DrawSpinner() {
        var xPos = _this.width / 2;
        var yPos = _this.height / 2;
        _this.ctx.clearRect(0, 0, _this.width, _this.height);
        _this.ctx.drawImage(knob_Base, 0, 0, _this.width, _this.height);
        // _this.ctx.beginPath();
        // _this.ctx.font = "normal 14px Calibri";
        // _this.ctx.fillText(min, _this.width / 7, _this.height - 20);
        // _this.ctx.fillText(max, _this.width * 6 / 7, _this.height - 20);
        // _this.ctx.closePath();
        _this.ctx.save();   //保存之前位置
        _this.ctx.translate(xPos, yPos);
        _this.ctx.rotate(_this.radian - 135 / 180 * Math.PI);  //旋转, 初始位置为左下角
        _this.ctx.translate(-xPos, -yPos);
        _this.ctx.drawImage(knob_Spinner, 0, 0, _this.width, _this.height);
        _this.ctx.restore();  //恢复之前位置
        _this.ctx.beginPath();
        _this.ctx.font = "normal 14px Calibri";
        _this.ctx.fillText(min, 0, _this.height);
        _this.ctx.fillText(max, _this.width - 7 * max.toString().length, _this.height); //字体大小为14
        _this.ctx.closePath();
    }

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
            _this.data = _this.radian * ratio + min;
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
}