"""RekaSains AI-Agent Service (6-Sub-Agent Google ADK Engine)."""

# Starlette >= 1.0 / FastAPI compatibility shims
import starlette.middleware
import starlette.routing

_orig_router_init = starlette.routing.Router.__init__


def _patched_router_init(self, *args, on_startup=None, on_shutdown=None, **kwargs):  # type: ignore[no-untyped-def]
    _orig_router_init(self, *args, **kwargs)
    self.on_startup = [] if on_startup is None else list(on_startup)
    self.on_shutdown = [] if on_shutdown is None else list(on_shutdown)


starlette.routing.Router.__init__ = _patched_router_init  # type: ignore[method-assign]
starlette.middleware.Middleware.__iter__ = lambda self: iter((self.cls, self.kwargs))  # type: ignore[method-assign]
