# Fence Article Test

*Demonstrating that fenced markers are shown as code.*

## 1. Example

A chart marker shown as an example. Because the example itself contains a
data fence, the outer fence uses **four** backticks (CommonMark nesting):

````markdown
<!-- @chart type="pie" title="Example" -->
```csv
label,value
A,60
B,40
```
<!-- /@chart -->
````

And a real chart that SHOULD render with its data:

<!-- @chart type="pie" title="Real" -->
```csv
label,value
Chrome,70
Safari,30
```
<!-- /@chart -->
