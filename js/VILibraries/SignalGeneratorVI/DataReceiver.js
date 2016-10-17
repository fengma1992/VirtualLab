/**
 * Created by Fengma on 2016/10/13.
 */

function DataReceiver(domElement) {
    var _this = this;
    this.ctx = domElement.getContext('2d');
    this.output = [];
    this.dataLength = 1024;
    this.index = 0;
    this.receiveData = function (data) {
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
    }
}