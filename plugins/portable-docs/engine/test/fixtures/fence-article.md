# Fence Article Test

*Demonstrating that fenced markers are shown as code.*

## 1. Example

Here is a chart marker shown as an example:

```markdown
<!-- @chart type="pie" title="Example" -->
```csv
label,value
A,60
B,40
```
<!-- /@chart -->
```

And a real chart that SHOULD render:

<!-- @chart type="pie" title="Real" -->
```csv
label,value
X,70
Y,30
```
<!-- /@chart -->
