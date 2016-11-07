/**
 * Created by Fengma on 2016/11/3.
 */

/**
 * 圆表盘
 * @param domElement
 * @constructor
 */
function RoundPanelVI(domElement) {

    'use strict';
    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.width = domElement.width;
    this.height = domElement.height;
    this.R = _this.width > _this.height ? _this.height / 2 : _this.width / 2;
    this.radius = this.R * 0.9;

    this.name = 'RoundPanelVI';
    this.cnText = '圆表盘';
    this.runningFlag = false;
    this.latestInput = 0;
    this.handAngle = Math.PI * 5 / 6;
    this.panelRangeAngle = Math.PI * 4 / 3;

    this.minValue = 0;
    this.maxValue = 100;
    this.bigSectionNum = 10;
    this.smallSectionNum = 10;
    this.unit = '';
    this.title = '';
    this.bgColor = "RGB(249, 250, 249)";
    this.screenColor = "RGB(61, 132, 185)";
    this.borderColor = "RGB(100,100,100)";

    this.fontColor = "RGB(0, 0, 0)";
    this.fontSize = (16 * _this.radius / 150).toFixed(0);

    //虚拟仪器中相连接的控件VI
    this.source = [];

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    this.setRange = function (minVal, maxVal, unitText, titleText) {

        minVal = isArray(minVal) ? minVal[minVal.length - 1] : minVal;
        if (isNaN(minVal)) {

            return false;
        }
        maxVal = isArray(maxVal) ? maxVal[maxVal.length - 1] : maxVal;
        if (isNaN(maxVal)) {

            return false;
        }
        if (maxVal < minVal) {

            return false;
        }
        _this.minValue = minVal;
        _this.maxValue = maxVal;

        if (typeof unitText === 'string') {

            _this.unit = unitText;
        }

        if (typeof titleText === 'string') {

            _this.title = titleText;
        }
        _this.draw();

    };

    this.setData = function (latestInput) {

        latestInput = isArray(latestInput) ? latestInput[latestInput.length - 1] : latestInput;
        if (isNaN(latestInput)) {

            return false;
        }
        latestInput = latestInput < _this.minValue ? _this.minValue : latestInput;
        latestInput = latestInput > _this.maxValue ? _this.maxValue : latestInput;
        _this.latestInput = parseFloat(latestInput).toFixed(2);
        _this.handAngle = Math.PI * 5 / 6 + _this.latestInput / _this.maxValue * _this.panelRangeAngle;
        _this.draw();
    };

    this.drawHand = function () {

        _this.ctx.save();
        // 位移到目标点
        _this.ctx.translate(this.R, this.R);
        _this.ctx.rotate(_this.handAngle);
        _this.ctx.moveTo(-_this.radius * 0.05, 0);
        _this.ctx.lineTo(0, -_this.radius * 0.02);
        _this.ctx.lineTo(_this.radius * 0.75, 0);
        _this.ctx.lineTo(0, _this.radius * 0.02);
        _this.ctx.lineTo(-_this.radius * 0.05, 0);
        _this.ctx.fillStyle = _this.screenColor;
        _this.ctx.fill();
        _this.ctx.restore();

    };

    this.draw = function () {

        // 画出背景边框
        _this.ctx.beginPath();
        _this.ctx.arc(this.R, this.R, _this.R, 0, 360, false);
        _this.ctx.lineTo(this.R * 2, this.R);
        _this.ctx.fillStyle = _this.borderColor;//填充颜色
        _this.ctx.fill();//画实心圆
        _this.ctx.closePath();
        // 画出背景圆
        _this.ctx.beginPath();
        _this.ctx.arc(this.R, this.R, _this.R * 0.97, 0, 360, false);
        _this.ctx.fillStyle = _this.bgColor;//填充颜色
        _this.ctx.fill();//画实心圆
        _this.ctx.closePath();
        // 保存
        _this.ctx.save();
        // 位移到目标点
        _this.ctx.translate(this.R, this.R);
        // 画出圆弧
        _this.ctx.beginPath();
        _this.ctx.arc(0, 0, _this.radius * 0.98, Math.PI * 5 / 6, Math.PI / 6, false);
        _this.ctx.arc(0, 0, _this.radius, Math.PI / 6, Math.PI * 5 / 6, true);
        _this.ctx.lineTo(_this.radius * 0.98 * Math.cos(Math.PI * 5 / 6), _this.radius * 0.98 * Math.sin(Math.PI * 5 / 6));
        _this.ctx.restore();
        _this.ctx.fillStyle = _this.screenColor;
        _this.ctx.fill();
        _this.ctx.beginPath();
        _this.ctx.lineCap = "round";
        _this.ctx.lineWidth = 2;
        if (_this.radius < 150) {

            _this.ctx.lineWidth = 1;
        }
        _this.ctx.strokeStyle = _this.screenColor;
        var i, j;
        // 保存
        _this.ctx.save();
        // 位移到目标点
        _this.ctx.translate(this.R, this.R);

        var rotateAngle = Math.PI * 5 / 6, position, markStr, fontSize;
        _this.ctx.font = 'normal ' + _this.fontSize / 2 + 'px Microsoft YaHei';
        fontSize = /\d+/.exec(_this.ctx.font)[0];
        for (i = 0; i <= _this.bigSectionNum; i++) {

            _this.ctx.save();
            _this.ctx.rotate(rotateAngle);
            _this.ctx.moveTo(_this.radius * 0.99, 0);
            _this.ctx.lineTo(_this.radius * 0.9, 0);
            _this.ctx.restore();

            if (_this.R > 100) {
                for (j = 1; j < _this.smallSectionNum; j++) {

                    if (i == _this.bigSectionNum) {
                        break;
                    }
                    _this.ctx.save();
                    _this.ctx.rotate(rotateAngle);
                    _this.ctx.rotate(j * _this.panelRangeAngle / _this.smallSectionNum / _this.bigSectionNum);
                    _this.ctx.moveTo(_this.radius * 0.99, 0);
                    _this.ctx.lineTo(_this.radius * 0.95, 0);
                    _this.ctx.restore();
                }

                if (i > 0 && i < _this.bigSectionNum) {

                    markStr = dataFormation((_this.maxValue - _this.minValue) / _this.bigSectionNum * i + _this.minValue);
                    position = parsePosition(rotateAngle);
                    _this.ctx.fillText(markStr, position[0] - fontSize / 4 * markStr.length, position[1]);
                }
            }
            rotateAngle += _this.panelRangeAngle / _this.bigSectionNum;
        }
        markStr = dataFormation(_this.minValue);
        position = parsePosition(Math.PI * 5 / 6);
        _this.ctx.fillText(markStr, position[0] - fontSize / 4 * markStr.length, position[1]);
        markStr = dataFormation(_this.maxValue);
        position = parsePosition(Math.PI * 5 / 6 + _this.panelRangeAngle);
        _this.ctx.fillText(markStr, position[0] - fontSize / 3 * markStr.length, position[1]);
        _this.ctx.restore();

        _this.ctx.font = 'bold ' + _this.fontSize + 'px Microsoft YaHei';
        fontSize = /\d+/.exec(_this.ctx.font)[0];
        markStr = _this.latestInput.toString() + _this.unit;
        _this.ctx.fillText(markStr, this.R - fontSize / 4 * markStr.length, this.R * 3 / 2);
        markStr = _this.title;
        _this.ctx.fillText(markStr, this.R - fontSize / 4 * markStr.length, this.R * 1 / 2);
        _this.ctx.stroke();
        _this.ctx.closePath();
        _this.drawHand();
    }
    ;
    this.draw();

    this.reset = function () {

        _this.latestInput = 0;
    };

    function parsePosition(angle) {

        var position = [];
        position[0] = _this.radius * 0.82 * Math.cos(angle);
        position[1] = _this.radius * 0.82 * Math.sin(angle);
        return position;
    }

    function dataFormation(data) {

        data = parseFloat(data);
        if (data == 0) {

            return '0';
        }
        if (Math.abs(data) >= 1000) {

            data = data / 1000;
            data = data.toFixed(1).toString() + 'k';
        }
        else if (Math.abs(data) < 1000 && Math.abs(data) >= 100) {

            data = data.toFixed(0).toString();
        }
        else if (Math.abs(data) < 100 && Math.abs(data) >= 10) {

            data = data.toFixed(1).toString();
        }
        else if (Math.abs(data) < 10) {

            data = data.toFixed(2).toString();
        }
        return data;
    }
}