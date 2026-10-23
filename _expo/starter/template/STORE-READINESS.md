# Store readiness

- [ ] Unique bundle/package IDs, scheme, icons, splash, version, and EAS project ownership
- [ ] Hosted privacy, terms, and support URLs replace all `example.com` values
- [ ] Privacy labels/manifests match only the capabilities and vendors actually enabled
- [ ] Required permission copy is purpose-specific and denied/restricted states are usable
- [ ] Auth provider redirects and in-app account deletion pass on physical devices
- [ ] Purchase, restore, cancellation, offline entitlement, and sandbox tester flows pass if enabled
- [ ] Notifications and deep links pass foreground/background/killed-state tests if enabled
- [ ] Production env exists in EAS; no service-role, AI-provider, signing, or other server secret is bundled
- [ ] `bash start.sh verify` and a release build pass; native features are tested on representative hardware
- [ ] App Review notes explain sign-in, purchases, hardware needs, core test steps, and demo access
