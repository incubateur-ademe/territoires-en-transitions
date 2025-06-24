import React from 'react';

export const Spacer = ({
  height,
}: {
  height:
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 12
    | 14
    | 16
    | 18
    | 20
    | 24
    | 28
    | 32
    | 36
    | 40
    | 44
    | 48
    | 52
    | 56
    | 60
    | 64
    | 68
    | 72
    | 76
    | 80
    | 84
    | 88
    | 92
    | 96
    | 100;
}) => <div style={{ height: `${height}rem` }} />;
