# Owned Expo starter system

This directory deliberately keeps two different things:

- `upstream-snapshot/` is the complete Simonstorms source captured at the commit in `SOURCE.json`,
  minus only its nested Git metadata. It is evidence, attribution, and a future comparison point.
- `template/` is our independently maintained starter. It removes the nicotine demo, keeps the useful
  operational integrations, and adds local-first data, reusable UI primitives, scripts, and agent docs.
- `generator/` creates a new application from the owned template and applies identity/theme from one plan.

Create an app:

```bash
cp starter/project-plan.example.json /tmp/my-plan.json
# edit the plan
bash start.sh create ../my-app --plan /tmp/my-plan.json
cd ../my-app
bash start.sh setup
```

The generator never modifies `upstream-snapshot/`, never adds a remote, and refuses a non-empty target.
