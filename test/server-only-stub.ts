// Vitest runs modules in plain Node, not a bundler that enforces the
// server/client component boundary, so the real "server-only" package
// (which just throws unconditionally) is aliased to this no-op instead.
export {};
