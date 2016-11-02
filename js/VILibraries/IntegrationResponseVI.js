/**
 * Created by Fengma on 2016/10/26.
 */

/**
 * 积分响应
 * @param domElement
 * @constructor
 */
function IntegrationResponseVI(domElement) {
    'use strict';
    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'IntegrationResponseVI';
    this.cnText = '积分响应';
    this.runningFlag = false;

    this.signalType = 2;
    this.k1 = 0;
    this.k2 = 1;
    this.k3 = 0;
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
    this.autoSave = true;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = typeof input === 'object' ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v2, v21;

        v21 = _this.temp1 + 0.5 * (_this.input + _this.lastInput) / _this.Fs;
        _this.temp1 = v21;
        v2 = _this.k2 * v21;


        _this.singleOutput = v2;
        _this.lastInput = _this.input;

        if (_this.autoSave) {

            _this.dataCollector(_this.singleOutput);
        }

        return _this.singleOutput;

    };

    /**
     * 将输出数保存在数组内
     * @param data singleOutput
     */
    this.dataCollector = function (data) {

        var i = 0;
        if (_this.index == 0) {
            for (i = 0; i < _this.dataLength; i++) {
                _this.output[i] = 0;
            }
        }
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = data;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = data;
        }
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
        _this.ctx.fillText('积分', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
}