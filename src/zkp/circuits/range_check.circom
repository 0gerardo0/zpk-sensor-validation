pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template RangeCheck(n) {
    signal input val;
    signal input min;
    signal input max;

    component geq = GreaterEqThan(n);
    geq.in[0] <== val;
    geq.in[1] <== min;

    component leq = LessEqThan(n);
    leq.in[0] <== val;
    leq.in[1] <== max;

    geq.out === 1;
    leq.out === 1;
}

component main {public [min, max]} = RangeCheck(32);
