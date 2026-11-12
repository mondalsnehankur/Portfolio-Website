/* Tiny libm replacements so physics.c compiles unchanged to WebAssembly without a C library.
 * sqrt/fabs map to single WebAssembly instructions. pow() supports integer exponents only,
 * which is all physics.c uses (pow(r, 3.0)); other exponents return NaN. */
#include "math.h"
double sqrt(double x) { return __builtin_sqrt(x); }
double fabs(double x) { return __builtin_fabs(x); }
double pow(double x, double y) {
    long n = (long)y;
    if ((double)n != y || n < 0 || n > 64) return NAN;
    double r = 1.0;
    while (n--) r *= x;
    return r;
}
