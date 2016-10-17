/**
 * Created by Fengma on 2016/10/18.
 */

function AddVI(domElement) {

    var _this = this;
    this.container = domElement;
    this.originalInput = 0;
    this.latestInput = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [];
    this.autoSave = true;

    this.calculate = function (latestInput) {

        _this.latestInput = latestInput;
        _this.singleOutput = _this.originalInput - _this.latestInput;

        if (_this.autoSave)
            _this.dataCollector(_this.singleOutput);

        return _this.singleOutput;
    };

    /**
     * 将输出数保存在数组内
     * @param data singleOutput
     */
    this.dataCollector = function (data) {

        var i = 0;
        if (_this.index == 0) {
            for (i = 0; i < _this.dataLength - 1; i++) {
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

        this.originalInput = 0;
        this.latestInput = 0;
        this.singleOutput = 0;
        _this.index = 0;
    }
}