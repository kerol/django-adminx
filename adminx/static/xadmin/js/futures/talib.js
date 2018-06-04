/*
 * tech analysis library
 * records格式:
 * {
    'Time': new Date().getTime(),
    'Open': open,
    'Close': close,
    'High': high,
    'Low': low,
    'Volume': volume,
   }
 */
var Std = {
    _skip: function (arr, period) {
        var j = 0;
        for (var k = 0; j < arr.length; j++) {
            if (!isNaN(arr[j]))
                k++;
            if (k == period)
                break;
        }
        return j;
    },
    _sum: function (arr, num) {
        var sum = 0.0;
        for (var i = 0; i < num; i++) {
            if (!isNaN(arr[i])) {
                sum += arr[i];
            }
        }
        return sum;
    },

    _avg: function (arr, num) {
        var n = 0;
        var sum = 0.0;
        for (var i = 0; i < num; i++) {
            if (!isNaN(arr[i])) {
                sum += arr[i];
                n++;
            }
        }
        return sum / n;
    },

    _zeros: function (len) {
        var n = [];
        for (var i = 0; i < len; i++) {
            n.push(0.0);
        }
        return n;
    },

    _set: function (arr, start, end, value) {
        var e = Math.min(arr.length, end);
        for (var i = start; i < e; i++) {
            arr[i] = value;
        }
    },

    _diff: function (a, b) {
        var d = [];
        for (var i = 0; i < b.length; i++) {
            if (isNaN(a[i]) || isNaN(b[i])) {
                d.push(NaN);
            } else {
                d.push(a[i] - b[i]);
            }
        }
        return d;
    },
    _move_diff: function (a) {
        var d = [];
        for (var i = 1; i < a.length; i++) {
            d.push(a[i] - a[i - 1]);
        }
        return d;
    },
    _sma: function (S, period) {
        var R = Std._zeros(S.length);
        var j = Std._skip(S, period);
        Std._set(R, 0, j, NaN);
        if (j < S.length) {
            var sum = 0;
            for (var i = j; i < S.length; i++) {
                if (i == j) {
                    sum = Std._sum(S, i + 1);
                } else {
                    sum += S[i] - S[i - period];
                }
                R[i] = sum / period;
            }
        }
        return R;
    },

    _smma: function (S, period) {
        var R = Std._zeros(S.length);
        var j = Std._skip(S, period);
        Std._set(R, 0, j, NaN);
        if (j < S.length) {
            R[j] = Std._avg(S, j + 1);
            for (var i = j + 1; i < S.length; i++) {
                R[i] = (R[i - 1] * (period - 1) + S[i]) / period;
            }
        }
        return R;
    },
    _ema: function (S, period) {
        var R = Std._zeros(S.length);
        var multiplier = 2.0 / (period + 1);
        var j = Std._skip(S, period);
        Std._set(R, 0, j, NaN);
        if (j < S.length) {
            R[j] = Std._avg(S, j + 1);
            for (var i = j + 1; i < S.length; i++) {
                R[i] = ((S[i] - R[i - 1]) * multiplier) + R[i - 1];
            }
        }
        return R;
    },
    _cmp: function (arr, start, end, cmpFunc) {
        var v = arr[start];
        for (var i = start; i < end; i++) {
            v = cmpFunc(arr[i], v);
        }
        return v;
    },
    _filt: function (records, n, attr, iv, cmpFunc) {
        if (records.length < 2) {
            return NaN;
        }
        var v = iv;
        var pos = n !== 0 ? records.length - Math.min(records.length - 1, n) - 1 : 0;
        for (var i = records.length - 2; i >= pos; i--) {
            if (typeof(attr) !== 'undefined') {
                v = cmpFunc(v, records[i][attr]);
            } else {
                v = cmpFunc(v, records[i]);
            }
        }
        return v;
    },
    _ticks: function (records) {
        if (records.length === 0) {
            return [];
        }
        var ticks = [];
        if (typeof(records[0].Close) !== 'undefined') {
            for (var i = 0; i < records.length; i++) {
                ticks.push(records[i].Close);
            }
        } else {
            ticks = records;
        }
        return ticks;
    },
};

var TA = {
    Highest: function (records, n, attr) {
        return Std._filt(records, n, attr, Number.MIN_VALUE, Math.max);
    },
    Lowest: function (records, n, attr) {
        return Std._filt(records, n, attr, Number.MAX_VALUE, Math.min);
    },

    MA: function (records, period) {
        period = typeof(period) === 'undefined' ? 9 : period;
        return Std._sma(Std._ticks(records), period);
    },
    SMA: function (records, period) {
        period = typeof(period) === 'undefined' ? 9 : period;
        return Std._sma(Std._ticks(records), period);
    },

    EMA: function (records, period) {
        period = typeof(period) === 'undefined' ? 9 : period;
        return Std._ema(Std._ticks(records), period);
    },

    MACD: function (records, fastEMA, slowEMA, signalEMA) {
        fastEMA = typeof(fastEMA) === 'undefined' ? 12 : fastEMA;
        slowEMA = typeof(slowEMA) === 'undefined' ? 26 : slowEMA;
        signalEMA = typeof(signalEMA) === 'undefined' ? 9 : signalEMA;
        var ticks = Std._ticks(records);
        var slow = Std._ema(ticks, slowEMA);
        var fast = Std._ema(ticks, fastEMA);
        // DIF
        var dif = Std._diff(fast, slow);
        // DEA
        var signal = Std._ema(dif, signalEMA);
        var histogram = Std._diff(dif, signal);
        return [dif, signal, histogram];
    },

    BOLL: function (records, period, multiplier) {
        period = typeof(period) === 'undefined' ? 20 : period;
        multiplier = typeof(multiplier) === 'undefined' ? 2 : multiplier;
        var S = Std._ticks(records);
        for (var j = period - 1; j < S.length && isNaN(S[j]); j++) ;
        var UP = Std._zeros(S.length);
        var MB = Std._zeros(S.length);
        var DN = Std._zeros(S.length);
        Std._set(UP, 0, j, NaN);
        Std._set(MB, 0, j, NaN);
        Std._set(DN, 0, j, NaN);
        var sum = 0;
        for (var i = j; i < S.length; i++) {
            if (i == j) {
                for (var k = 0; k < period; k++) {
                    sum += S[k];
                }
            } else {
                sum = sum + S[i] - S[i - period];
            }
            var ma = sum / period;
            var d = 0;
            for (var k = i + 1 - period; k <= i; k++) {
                d += (S[k] - ma) * (S[k] - ma);
            }
            var stdev = Math.sqrt(d / period);
            var up = ma + (multiplier * stdev);
            var dn = ma - (multiplier * stdev);
            UP[i] = up;
            MB[i] = ma;
            DN[i] = dn;
        }
        // upper, middle, lower
        return [UP, MB, DN];
    },

    KDJ: function (records, n, k, d) {
        n = typeof(n) === 'undefined' ? 9 : n;
        k = typeof(k) === 'undefined' ? 3 : k;
        d = typeof(d) === 'undefined' ? 3 : d;

        var RSV = Std._zeros(records.length);
        Std._set(RSV, 0, n - 1, NaN);
        var K = Std._zeros(records.length);
        var D = Std._zeros(records.length);
        var J = Std._zeros(records.length);

        var hs = Std._zeros(records.length);
        var ls = Std._zeros(records.length);
        for (var i = 0; i < records.length; i++) {
            hs[i] = records[i].High;
            ls[i] = records[i].Low;
        }

        for (var i = 0; i < records.length; i++) {
            if (i >= (n - 1)) {
                var c = records[i].Close;
                var h = Std._cmp(hs, i - (n - 1), i + 1, Math.max);
                var l = Std._cmp(ls, i - (n - 1), i + 1, Math.min);
                RSV[i] = 100 * ((c - l) / (h - l));
                K[i] = (1 * RSV[i] + (k - 1) * K[i - 1]) / k;
                D[i] = (1 * K[i] + (d - 1) * D[i - 1]) / d;
            } else {
                K[i] = D[i] = 50;
                RSV[i] = 0;
            }
            J[i] = 3 * K[i] - 2 * D[i];
        }
        // remove prefix
        for (var i = 0; i < n - 1; i++) {
            K[i] = D[i] = J[i] = NaN;
        }
        return [K, D, J];
    },

    RSI: function (records, period) {
        period = typeof(period) === 'undefined' ? 14 : period;
        var i;
        var n = period;
        var rsi = Std._zeros(records.length);
        Std._set(rsi, 0, rsi.length, NaN);
        if (records.length < n) {
            return rsi;
        }
        var ticks = Std._ticks(records);
        var deltas = Std._move_diff(ticks);
        var seed = deltas.slice(0, n);
        var up = 0;
        var down = 0;
        for (i = 0; i < seed.length; i++) {
            if (seed[i] >= 0) {
                up += seed[i];
            } else {
                down += seed[i];
            }
        }
        up /= n;
        down = -(down /= n);
        var rs = down != 0 ? up / down : 0;
        rsi[n] = 100 - 100 / (1 + rs);
        var delta = 0;
        var upval = 0;
        var downval = 0;
        for (i = n + 1; i < ticks.length; i++) {
            delta = deltas[i - 1];
            if (delta > 0) {
                upval = delta;
                downval = 0;
            } else {
                upval = 0;
                downval = -delta;
            }
            up = (up * (n - 1) + upval) / n;
            down = (down * (n - 1) + downval) / n;
            rs = up / down;
            rsi[i] = 100 - 100 / (1 + rs);
        }
        return rsi;
    },
    OBV: function (records) {
        if (records.length === 0) {
            return [];
        }
        if (typeof(records[0].Close) === 'undefined') {
            throw "argument must KLine";
        }
        var R = [];
        for (var i = 0; i < records.length; i++) {
            if (i === 0) {
                R[i] = records[i].Volume;
            } else if (records[i].Close >= records[i - 1].Close) {
                R[i] = R[i - 1] + records[i].Volume;
            } else {
                R[i] = R[i - 1] - records[i].Volume;
            }
        }
        return R;
    },
    ATR: function (records, period) {
        if (records.length === 0) {
            return [];
        }
        if (typeof(records[0].Close) === 'undefined') {
            throw "argument must KLine";
        }
        period = typeof(period) === 'undefined' ? 14 : period;
        var R = Std._zeros(records.length);
        var sum = 0;
        var n = 0;
        for (var i = 0; i < records.length; i++) {
            var TR = 0;
            if (i == 0) {
                TR = records[i].High - records[i].Low;
            } else {
                TR = Math.max(records[i].High - records[i].Low, Math.abs(records[i].High - records[i - 1].Close), Math.abs(records[i - 1].Close - records[i].Low));
            }
            sum += TR;
            if (i < period) {
                n = sum / (i + 1);
            } else {
                n = (((period - 1) * n) + TR) / period;
            }
            R[i] = n;
        }
        return R;
    },
    Alligator: function (records, jawLength, teethLength, lipsLength) {
        jawLength = typeof(jawLength) === 'undefined' ? 13 : jawLength;
        teethLength = typeof(teethLength) === 'undefined' ? 8 : teethLength;
        lipsLength = typeof(lipsLength) === 'undefined' ? 5 : lipsLength;
        var ticks = [];
        for (var i = 0; i < records.length; i++) {
            ticks.push((records[i].High + records[i].Low) / 2);
        }
        return [
            [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN].concat(Std._smma(ticks, jawLength)), // jaw (blue)
            [NaN, NaN, NaN, NaN, NaN].concat(Std._smma(ticks, teethLength)), // teeth (red)
            [NaN, NaN, NaN].concat(Std._smma(ticks, lipsLength)), // lips (green)
        ];
    },
    CMF: function (records, periods) {
        periods = periods || 20;
        var ret = [];
        var sumD = 0;
        var sumV = 0;
        var arrD = [];
        var arrV = [];
        for (var i = 0; i < records.length; i++) {
            var d = (records[i].High == records[i].Low) ? 0 : (2 * records[i].Close - records[i].Low - records[i].High) / (records[i].High - records[i].Low) * records[i].Volume;
            arrD.push(d);
            arrV.push(records[i].Volume);
            sumD += d;
            sumV += records[i].Volume;
            if (i >= periods) {
                sumD -= arrD.shift();
                sumV -= arrV.shift();
            }
            ret.push(sumD / sumV);
        }
        return ret;
    }
};