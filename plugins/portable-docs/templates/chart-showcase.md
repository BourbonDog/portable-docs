<!-- @header -->
<!-- @title value="Chart Showcase" -->
<!-- @subtitle value="The seven data-driven chart types" -->
<!-- /@header -->

## 1. Categorical

<!-- @chart type="pie" title="Browser Share" subtitle="Q2 2026" -->
```csv
label,value
Chrome,65
Safari,18
Edge,12
Other,5
```
<!-- /@chart -->

<!-- @chart type="donut" title="Budget Split" -->
```csv
label,value
Engineering,55
Sales,25
Ops,20
```
<!-- /@chart -->

## 2. Comparison

<!-- @chart type="grouped-bar" title="Revenue by Quarter" ylabel="$M" -->
```csv
quarter,Product A,Product B
Q1,120,80
Q2,150,95
Q3,170,110
```
<!-- /@chart -->

<!-- @chart type="stacked-bar" title="Headcount" -->
```csv
team,Eng,Design,PM
2024,20,5,3
2025,32,8,6
```
<!-- /@chart -->

## 3. Trend

<!-- @chart type="area" title="Demand Index" xlabel="Year" ylabel="Index" -->
```csv
year,AI/ML
2019,100
2022,210
2025,340
```
<!-- /@chart -->

<!-- @chart type="line" title="Two Series" -->
```csv
year,A,B
2019,10,5
2022,28,18
2025,40,30
```
<!-- /@chart -->

## 4. Distribution

<!-- @chart type="scatter" title="Effort vs Impact" xlabel="Effort" ylabel="Impact" -->
```csv
x,y,label
2,80,Alpha
7,40,Beta
9,90,Gamma
```
<!-- /@chart -->

> See also: [[diagram-showcase]] for native `@flow`, `@quadrant`, and `@mermaid` diagrams.
