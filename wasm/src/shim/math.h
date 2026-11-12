/* Minimal <math.h> for the freestanding WebAssembly build (no libc available). */
#ifndef SHIM_MATH_H
#define SHIM_MATH_H
#define NAN (__builtin_nan(""))
#define INFINITY (__builtin_inf())
double sqrt(double x);
double pow(double x, double y);
double fabs(double x);
#endif
