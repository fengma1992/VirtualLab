/**
 * Created by Fengma on 2016/10/26.
 */

/**
 * 比例微分响应
 * @param domElement
 * @constructor
 */
function ProportionDifferentiationResponseVI(domElement) {
    'use strict';
    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'ProportionDifferentiationResponseVI';
    this.cnText = '比例微分响应';
    this.runningFlag = false;

    this.signalType = 5;
    this.k1 = 1;
    this.k2 = 0;
    this.k3 = 1;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    this.setData = function (input) {

        _this.input = isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v1, v3;

        v1 = _this.k1 * _this.input;

        v3 = _this.k3 * (_this.input - _this.lastInput) * _this.Fs;

        _this.singleOutput = v1 + v3;
        _this.lastInput = _this.input;


        //将输出数保存在数组内
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

        return _this.singleOutput;

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
    };


    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('微分', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
}