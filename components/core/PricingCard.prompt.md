Rounded white card for a single pricing tier; used in a horizontal row of 5 on the Pricing section.

```jsx
<PricingCard
  tierLabel="Up to 5,000 employees"
  tierName="Enterprise"
  description="Cross-functional training, LMS integration, and observability dashboards"
  price="$35,000"
  highlighted
/>
```

Only one card in a row should be `highlighted` at a time (the recommended tier) — it gets a 1px Orange Crush border while siblings use the default hairline. Square corners throughout (this system does not round cards).
