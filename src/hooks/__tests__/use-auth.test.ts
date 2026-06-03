import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockProject = (id: string) => ({
  id,
  name: `Project ${id}`,
  userId: "user-1",
  messages: "[]",
  data: "{}",
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockProjectSummary = (id: string) => ({
  id,
  name: `Project ${id}`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    test("isLoading is false by default", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    describe("happy path", () => {
      test("calls signInAction with provided credentials", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: false, error: "fail" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "secret123");
        });

        expect(signInAction).toHaveBeenCalledWith("user@example.com", "secret123");
      });

      test("redirects to the most recent project on success", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue([
          mockProjectSummary("proj-a"),
          mockProjectSummary("proj-b"),
        ]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "secret123");
        });

        expect(mockPush).toHaveBeenCalledWith("/proj-a");
      });

      test("creates a new project and redirects when user has no projects", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue([]);
        vi.mocked(createProject).mockResolvedValue(mockProject("new-proj"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "secret123");
        });

        expect(createProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: [], data: {} })
        );
        expect(mockPush).toHaveBeenCalledWith("/new-proj");
      });

      test("saves anonymous work as a new project and redirects to it", async () => {
        const anonWork = {
          messages: [{ role: "user", content: "build a counter" }],
          fileSystemData: { "/App.jsx": { type: "file", content: "export default () => null" } },
        };
        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
        vi.mocked(createProject).mockResolvedValue(mockProject("saved-anon"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "secret123");
        });

        expect(createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: anonWork.messages,
            data: anonWork.fileSystemData,
          })
        );
        expect(clearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/saved-anon");
      });

      test("returns the result from signInAction", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue([mockProjectSummary("p1")]);

        const { result } = renderHook(() => useAuth());

        let returnValue: any;
        await act(async () => {
          returnValue = await result.current.signIn("user@example.com", "secret123");
        });

        expect(returnValue).toEqual({ success: true });
      });
    });

    describe("error state", () => {
      test("returns the error result when sign in fails", async () => {
        vi.mocked(signInAction).mockResolvedValue({
          success: false,
          error: "Invalid credentials",
        });

        const { result } = renderHook(() => useAuth());

        let returnValue: any;
        await act(async () => {
          returnValue = await result.current.signIn("user@example.com", "wrong");
        });

        expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
      });

      test("does not redirect when sign in fails", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "wrong");
        });

        expect(mockPush).not.toHaveBeenCalled();
      });

      test("does not call getProjects when sign in fails", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: false, error: "fail" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "wrong");
        });

        expect(getProjects).not.toHaveBeenCalled();
      });
    });

    describe("loading state", () => {
      test("isLoading is false after sign in completes", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: false, error: "fail" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "secret123");
        });

        expect(result.current.isLoading).toBe(false);
      });

      test("isLoading resets to false even when signInAction throws", async () => {
        vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "secret123").catch(() => {});
        });

        expect(result.current.isLoading).toBe(false);
      });
    });

    describe("edge cases", () => {
      test("skips anon work project creation when messages array is empty", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue({ messages: [], fileSystemData: {} });
        vi.mocked(getProjects).mockResolvedValue([mockProjectSummary("proj-a")]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "secret123");
        });

        expect(clearAnonWork).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/proj-a");
      });

      test("does not call getProjects when anonymous work is present", async () => {
        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue({
          messages: [{ role: "user", content: "hi" }],
          fileSystemData: {},
        });
        vi.mocked(createProject).mockResolvedValue(mockProject("anon-proj"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "secret123");
        });

        expect(getProjects).not.toHaveBeenCalled();
      });
    });
  });

  describe("signUp", () => {
    describe("happy path", () => {
      test("calls signUpAction with provided credentials", async () => {
        vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "fail" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
      });

      test("redirects to most recent project after successful sign up", async () => {
        vi.mocked(signUpAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue([mockProjectSummary("proj-x")]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/proj-x");
      });

      test("creates a new project and redirects when no existing projects", async () => {
        vi.mocked(signUpAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue([]);
        vi.mocked(createProject).mockResolvedValue(mockProject("first-proj"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/first-proj");
      });

      test("returns the success result from signUpAction", async () => {
        vi.mocked(signUpAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue([mockProjectSummary("p1")]);

        const { result } = renderHook(() => useAuth());

        let returnValue: any;
        await act(async () => {
          returnValue = await result.current.signUp("new@example.com", "password123");
        });

        expect(returnValue).toEqual({ success: true });
      });
    });

    describe("error state", () => {
      test("returns error result when sign up fails", async () => {
        vi.mocked(signUpAction).mockResolvedValue({
          success: false,
          error: "Email already registered",
        });

        const { result } = renderHook(() => useAuth());

        let returnValue: any;
        await act(async () => {
          returnValue = await result.current.signUp("existing@example.com", "password123");
        });

        expect(returnValue).toEqual({ success: false, error: "Email already registered" });
      });

      test("does not redirect when sign up fails", async () => {
        vi.mocked(signUpAction).mockResolvedValue({
          success: false,
          error: "Email already registered",
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("existing@example.com", "password123");
        });

        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    describe("loading state", () => {
      test("isLoading is false after sign up completes", async () => {
        vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "fail" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(result.current.isLoading).toBe(false);
      });

      test("isLoading resets to false even when signUpAction throws", async () => {
        vi.mocked(signUpAction).mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "password123").catch(() => {});
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
