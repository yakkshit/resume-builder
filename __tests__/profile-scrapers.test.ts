import { describe, it, expect, vi } from "vitest";
import { parseLinkedInPublicProfile, scrapeGitHubPublicProfile } from "@/lib/scrapers/profile-scrapers";

describe("Public Profile Scrapers & Parsers", () => {
  it("parses LinkedIn structured text correctly into roles, skills, and summary", () => {
    const rawLinkedIn = `
# Alex Rivera
Senior AI Engineer & Robotics Researcher

## About
Building multi-agent autonomous robotic swarms and real-time LLM inference pipelines.

## Skills
Python, C++, ROS2, PyTorch, LangChain, Next.js, FastAPIs

## Experience
### Research Assistant — University of Konstanz
* Designing decentralized perception and control pipelines in ROS2.
* Implemented multi-agent coordination frameworks.

### Software Engineer — Nutrish.ai
* Architected LangChain RAG pipelines over vector databases.

## Education
### M.Sc. in Computer Science — Universität Konstanz
`;

    const parsed = parseLinkedInPublicProfile(rawLinkedIn);

    expect(parsed.headline).toContain("Senior AI Engineer");
    expect(parsed.summary).toContain("Building multi-agent autonomous robotic swarms");
    expect(parsed.skills).toContain("Python");
    expect(parsed.skills).toContain("ROS2");
    expect(parsed.skills).toContain("PyTorch");
    expect(parsed.experiences.length).toBe(2);
    expect(parsed.experiences[0].title).toContain("Research Assistant");
    expect(parsed.experiences[0].company).toContain("University of Konstanz");
    expect(parsed.education.length).toBe(1);
    expect(parsed.education[0].institution).toContain("Universität Konstanz");
  });

  it("scrapes GitHub public user profile and repositories with language analysis", async () => {
    const fetchMock = vi.fn();

    // Mock 1: User info
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        name: "Yakkshit Sai",
        bio: "AI & Robotics Engineer",
        public_repos: 14,
        followers: 42,
      }),
    });

    // Mock 2: Repositories
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          name: "emergent-orchestras-ros2",
          description: "Multi-agent robot swarm control",
          language: "C++",
          stargazers_count: 18,
          fork: false,
          html_url: "https://github.com/yakkshit/emergent-orchestras-ros2",
        },
        {
          name: "cv-agent-rag",
          description: "Full-stack AI resume assistant",
          language: "TypeScript",
          stargazers_count: 35,
          fork: false,
          html_url: "https://github.com/yakkshit/cv-agent-rag",
        },
        {
          name: "autonomous-formula-nav",
          description: "Path planning algorithms",
          language: "C++",
          stargazers_count: 12,
          fork: false,
          html_url: "https://github.com/yakkshit/autonomous-formula-nav",
        },
      ],
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await scrapeGitHubPublicProfile("yakkshit");

    expect(result.username).toBe("yakkshit");
    expect(result.name).toBe("Yakkshit Sai");
    expect(result.bio).toBe("AI & Robotics Engineer");
    expect(result.topLanguages).toContain("C++");
    expect(result.topLanguages).toContain("TypeScript");
    expect(result.featuredRepositories?.length).toBe(3);
    expect(result.featuredRepositories?.[0].name).toBe("emergent-orchestras-ros2");

    vi.unstubAllGlobals();
  });
});
