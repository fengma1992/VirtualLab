/**
 * Created by Fengma on 2016/10/31.
 */


/**
 * 文本框
 * @param domElement
 * @constructor
 */
function TextVI(domElement) {

    'use strict';
    const _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'TextVI';
    this.cnText = '文本框';
    this.runningFlag = false;

    this.latestInput = 0;
    this.decimalPlace = 1;


    //虚拟仪器中相连接的控件VI
    this.source = [];

    this.setData = function (latestInput) {

        _this.latestInput = Array.isArray(latestInput) ? latestInput[latestInput.length - 1] : latestInput;
        if (Number.isNaN(_this.latestInput)) {

            return false;
        }

        let str = parseFloat(_this.latestInput).toFixed(_this.decimalPlace);
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText(str, _this.container.width / 2 - 6 * str.length, _this.container.height / 2 + 6);
    };

    this.setDecimalPlace = function (decimalPlace) {

        _this.decimalPlace = parseInt(decimalPlace);
        _this.setData(_this.latestInput);
    };

    this.reset = function () {

        this.originalInput = 0;
        this.latestInput = 0;
        this.singleOutput = 0;
        _this.index = 0;
    };

    this.draw = function () {
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('文本框', _this.container.width / 2 - 18, _this.container.height / 2 + 6);
    };

    this.draw();

}