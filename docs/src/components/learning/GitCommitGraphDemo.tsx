"use client";

import { useMemo, useState } from "react";

interface Commit {
  id: string;
  message: string;
  parents: string[];
  branch: string;
}

interface StashEntry {
  working: string[];
  staged: string[];
}

const initialCommit: Commit = {
  id: "c0",
  message: "init",
  parents: [],
  branch: "main",
};

export function GitCommitGraphDemo() {
  const [commits, setCommits] = useState<Commit[]>([initialCommit]);
  const [branches, setBranches] = useState<Record<string, string>>({
    main: "c0",
  });
  const [remoteHeads, setRemoteHeads] = useState<Record<string, string>>({});
  const [head, setHead] = useState("main");
  const [working, setWorking] = useState<string[]>([]);
  const [staged, setStaged] = useState<string[]>([]);
  const [stash, setStash] = useState<StashEntry[]>([]);
  const [commitCounter, setCommitCounter] = useState(1);
  const [fileCounter, setFileCounter] = useState(1);
  const [commitMessage, setCommitMessage] = useState("update");
  const [newBranchName, setNewBranchName] = useState("feature/demo");
  const [mergeTarget, setMergeTarget] = useState("main");
  const [notice, setNotice] = useState<string | null>(null);

  const headCommit = branches[head];

  const branchesByCommit = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(branches).forEach(([name, id]) => {
      if (!map[id]) map[id] = [];
      map[id].push(name);
    });
    return map;
  }, [branches]);

  const remotesByCommit = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(remoteHeads).forEach(([name, id]) => {
      if (!map[id]) map[id] = [];
      map[id].push(name);
    });
    return map;
  }, [remoteHeads]);

  const orderedCommits = useMemo(() => [...commits].reverse(), [commits]);

  const showNotice = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 1800);
  };

  const editFile = () => {
    const file = `change_${fileCounter}.md`;
    setWorking((prev) => [...prev, file]);
    setFileCounter((prev) => prev + 1);
  };

  const addAll = () => {
    if (working.length === 0) {
      showNotice("Tidak ada perubahan untuk di-stage");
      return;
    }
    setStaged((prev) => [...prev, ...working]);
    setWorking([]);
  };

  const commit = () => {
    if (staged.length === 0) {
      showNotice("Nothing to commit");
      return;
    }
    const id = `c${commitCounter}`;
    const newCommit: Commit = {
      id,
      message: commitMessage.trim() || "update",
      parents: [headCommit],
      branch: head,
    };
    setCommits((prev) => [...prev, newCommit]);
    setBranches((prev) => ({ ...prev, [head]: id }));
    setCommitCounter((prev) => prev + 1);
    setStaged([]);
  };

  const createBranch = () => {
    const name = newBranchName.trim();
    if (!name) {
      showNotice("Nama branch kosong");
      return;
    }
    if (branches[name]) {
      showNotice("Branch sudah ada");
      return;
    }
    setBranches((prev) => ({ ...prev, [name]: headCommit }));
  };

  const checkoutBranch = (name: string) => {
    if (!branches[name]) return;
    setHead(name);
  };

  const mergeBranch = () => {
    if (!branches[mergeTarget]) {
      showNotice("Target merge tidak valid");
      return;
    }
    if (mergeTarget === head) {
      showNotice("Pilih branch yang berbeda");
      return;
    }
    const id = `c${commitCounter}`;
    const newCommit: Commit = {
      id,
      message: `merge ${mergeTarget}`,
      parents: [headCommit, branches[mergeTarget]],
      branch: head,
    };
    setCommits((prev) => [...prev, newCommit]);
    setBranches((prev) => ({ ...prev, [head]: id }));
    setCommitCounter((prev) => prev + 1);
  };

  const resetSoft = () => {
    const current = commits.find((c) => c.id === headCommit);
    if (!current || current.parents.length === 0) {
      showNotice("Tidak ada parent untuk reset");
      return;
    }
    const parent = current.parents[0];
    setBranches((prev) => ({ ...prev, [head]: parent }));
    showNotice("Soft reset: HEAD mundur, staged tetap");
  };

  const revertCommit = () => {
    const id = `c${commitCounter}`;
    const newCommit: Commit = {
      id,
      message: `revert ${headCommit}`,
      parents: [headCommit],
      branch: head,
    };
    setCommits((prev) => [...prev, newCommit]);
    setBranches((prev) => ({ ...prev, [head]: id }));
    setCommitCounter((prev) => prev + 1);
  };

  const stashChanges = () => {
    if (working.length === 0 && staged.length === 0) {
      showNotice("Nothing to stash");
      return;
    }
    setStash((prev) => [...prev, { working, staged }]);
    setWorking([]);
    setStaged([]);
  };

  const popStash = () => {
    if (stash.length === 0) {
      showNotice("Stash kosong");
      return;
    }
    const last = stash[stash.length - 1];
    setStash((prev) => prev.slice(0, -1));
    setWorking((prev) => [...prev, ...last.working]);
    setStaged((prev) => [...prev, ...last.staged]);
  };

  const pushBranch = () => {
    setRemoteHeads((prev) => ({ ...prev, [`origin/${head}`]: headCommit }));
    showNotice(`Pushed ${head}`);
  };

  return (
    <div className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        Interactive Demo: Git Commit Graph
      </div>

      {notice && (
        <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-2 font-medium text-neutral-700 dark:text-neutral-300">
              Status
            </div>
            <div className="text-xs text-neutral-500">HEAD: {head}</div>
            <div className="mt-2">
              <div className="text-xs font-medium text-neutral-500">Working tree</div>
              {working.length === 0 ? (
                <div className="text-xs text-neutral-400">bersih</div>
              ) : (
                <div className="text-xs text-neutral-700 dark:text-neutral-300">
                  {working.join(", ")}
                </div>
              )}
            </div>
            <div className="mt-2">
              <div className="text-xs font-medium text-neutral-500">Staged</div>
              {staged.length === 0 ? (
                <div className="text-xs text-neutral-400">kosong</div>
              ) : (
                <div className="text-xs text-neutral-700 dark:text-neutral-300">
                  {staged.join(", ")}
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Stash: {stash.length}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={editFile}
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Edit file
            </button>
            <button
              onClick={addAll}
              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              git add .
            </button>
            <div className="flex gap-2">
              <input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                placeholder="commit message"
              />
              <button
                onClick={commit}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500"
              >
                git commit
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                placeholder="branch name"
              />
              <button
                onClick={createBranch}
                className="rounded-lg bg-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200"
              >
                git branch
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={head}
                onChange={(e) => checkoutBranch(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
              >
                {Object.keys(branches).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => checkoutBranch(head)}
                className="rounded-lg bg-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200"
              >
                git checkout
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
              >
                {Object.keys(branches)
                  .filter((name) => name !== head)
                  .map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
              </select>
              <button
                onClick={mergeBranch}
                className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500"
              >
                git merge
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={resetSoft}
                className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-400"
              >
                reset --soft
              </button>
              <button
                onClick={revertCommit}
                className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600"
              >
                git revert
              </button>
              <button
                onClick={stashChanges}
                className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200"
              >
                git stash
              </button>
              <button
                onClick={popStash}
                className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200"
              >
                stash pop
              </button>
            </div>
            <button
              onClick={pushBranch}
              className="w-full rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              git push
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Commit Graph
          </div>
          <div className="space-y-3">
            {orderedCommits.map((commit) => {
              const branchLabels = branchesByCommit[commit.id] || [];
              const remoteLabels = remotesByCommit[commit.id] || [];
              const isHead = headCommit === commit.id;

              return (
                <div key={commit.id} className="flex items-start gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <div
                      className={`h-3 w-3 rounded-full border-2 ${
                        isHead
                          ? "border-green-500 bg-green-500"
                          : "border-neutral-400 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800"
                      }`}
                    />
                    <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-700" />
                  </div>
                  <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-neutral-700 dark:text-neutral-200">
                        {commit.id}
                      </span>
                      <span className="text-neutral-500">{commit.message}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {branchLabels.map((name) => (
                        <span
                          key={name}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            name === head
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                              : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                          }`}
                        >
                          {name}
                        </span>
                      ))}
                      {remoteLabels.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                    {commit.parents.length > 0 && (
                      <div className="mt-1 text-[10px] text-neutral-400">
                        parents: {commit.parents.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
