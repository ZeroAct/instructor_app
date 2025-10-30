"""Main entry point for Instructor App."""

import sys


def main():
    """Main entry point."""
    if len(sys.argv) > 1 and sys.argv[1] == "mcp":
        # Run MCP server
        import asyncio
        from src.instructor_app.mcp.server import main as mcp_main
        asyncio.run(mcp_main())
    else:
        # Run web server
        import uvicorn
        uvicorn.run(
            "src.instructor_app.api.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
        )


if __name__ == "__main__":
    main()
