/**
 * Created by Fengma on 2016/10/18.
 */

/**
 * 加法器
 * @param domElement
 * @constructor
 */
function AddVI(domElement) {

    'use strict';
    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'AddVI';
    this.cnText = '加法器';
    this.runningFlag = false;
    this.dataSetCount = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.originalInput = 0;
    this.latestInput = 0;
    this.singleOutput = 0;
    this.output = [];
    this.outputCount = 2;
    this.inputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    this.setData = function (latestInput) {

        _this.latestInput = isArray(latestInput) ? latestInput[latestInput.length - 1] : latestInput;
        if (isNaN(_this.latestInput)) {

            return false;
        }
        _this.singleOutput = _this.originalInput - _this.latestInput;


        return _this.singleOutput;
    };

    this.setOriginalData = function (originalInput) {

        originalInput = isArray(originalInput) ? originalInput[originalInput.length - 1] : originalInput;
        if (isNaN(originalInput)) {

            return false;
        }
        _this.originalInput = originalInput;
        return _this.originalInput;
    };

    this.reset = function () {

        _this.originalInput = 0;
        _this.latestInput = 0;
        _this.singleOutput = 0;
        _this.index = 0;
    };

    this.draw = function () {
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('加法器', _this.container.width / 2 - 18, _this.container.height / 2 + 6);
    };

    this.draw();

}