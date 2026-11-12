/* Browser API for the Space Mission Calculator. physics.c, planets.c and space.h are the
 * original, unmodified project files. This file only exposes them to JavaScript and adds a
 * small orbit integrator for the interactive "Orbit lab". */
#include "space.h"
#include <math.h>

#define EXPORT(n) __attribute__((export_name(n)))

EXPORT("body_count") int body_count(void) { size_t n; get_bodies(&n); return (int)n; }
EXPORT("body_name") const char *body_name(int i) { return get_bodies(0)[i].name; }
EXPORT("body_mass") double body_mass(int i) { return get_bodies(0)[i].mass_kg; }
EXPORT("body_radius") double body_radius(int i) { return get_bodies(0)[i].radius_m; }
EXPORT("body_distance_km") double body_distance_km(int i) { return get_bodies(0)[i].distance_from_sun_km; }
EXPORT("body_period_days") double body_period_days(int i) { return get_bodies(0)[i].orbital_period_days; }
EXPORT("body_moons") int body_moons(int i) { return get_bodies(0)[i].moons; }
EXPORT("body_orbit_type") int body_orbit_type(int i) { return (int)get_bodies(0)[i].orbit_type; }
EXPORT("body_notes") const char *body_notes(int i) { return get_bodies(0)[i].notes; }
EXPORT("sun_mass") double sun_mass(void) { return SUN_MASS; }

/* Original physics functions, re-exported under stable names. */
EXPORT("calc_surface_gravity") double calc_surface_gravity(double m, double r) { return surface_gravity(m, r); }
EXPORT("calc_escape_velocity") double calc_escape_velocity(double m, double r) { return escape_velocity(m, r); }
EXPORT("calc_weight") double calc_weight(double m, double g) { return weight_newtons(m, g); }
EXPORT("calc_circular_velocity") double calc_circular_velocity(double m, double r) { return circular_orbital_velocity(m, r); }
EXPORT("calc_circular_period_days") double calc_circular_period_days(double m, double r) { return circular_orbital_period_days(m, r); }
EXPORT("calc_travel_days") double calc_travel_days(double km, double kms) { return approximate_travel_time_days(km, kms); }

/* ---- Orbit lab (added for the web demo) ---- */
static double state[8]; /* x, y, vx, vy, t */
EXPORT("orbit_state") double *orbit_state(void) { return state; }

/* Start at (r, 0) moving tangentially at speed_ratio x the circular velocity. */
EXPORT("orbit_init") void orbit_init(double M, double r, double speed_ratio) {
    state[0] = r; state[1] = 0.0; state[2] = 0.0;
    state[3] = speed_ratio * circular_orbital_velocity(M, r); state[4] = 0.0;
}

/* Leapfrog (kick-drift-kick) integrator; symplectic, so bound orbits keep their energy. */
EXPORT("orbit_advance") void orbit_advance(double M, double total_time, int steps) {
    double dt = total_time / steps, gm = G * M;
    for (int i = 0; i < steps; i++) {
        double r2 = state[0] * state[0] + state[1] * state[1], r = sqrt(r2), k = gm / (r2 * r);
        state[2] -= 0.5 * dt * k * state[0]; state[3] -= 0.5 * dt * k * state[1];
        state[0] += dt * state[2]; state[1] += dt * state[3];
        r2 = state[0] * state[0] + state[1] * state[1]; r = sqrt(r2); k = gm / (r2 * r);
        state[2] -= 0.5 * dt * k * state[0]; state[3] -= 0.5 * dt * k * state[1];
    }
    state[4] += total_time;
}
EXPORT("orbit_energy") double orbit_energy(double M, double r, double v) { return 0.5 * v * v - G * M / r; }
/* Tangential launch at radius r: returns periapsis (which==0) or apoapsis (which==1); -1 if unbound. */
EXPORT("orbit_apsis") double orbit_apsis(double M, double r, double v, int which) {
    double gm = G * M, eps = 0.5 * v * v - gm / r;
    if (eps >= 0.0) return -1.0;
    double a = -gm / (2.0 * eps), e = fabs(r * v * v / gm - 1.0);
    return which ? a * (1.0 + e) : a * (1.0 - e);
}
