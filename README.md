users:
  - id: 1
    info: {}
    preferences: {}
    inventory:
      - name: oatmeal
        quantity: 2
        unit: grams
      - name: banana
        quantity: 5
        unit: pieces

ingredients:
  - id: 1
    name: oatmeal
    unit: grams
    nutrition:
      calories: 68
      protein: 2.4
      carbs: 12
      fat: 1.4
      fiber: 1.7
  - id: 2
    name: banana
    unit: pieces
    nutrition:
      calories: 89
      protein: 1.1
      carbs: 23
      fat: 0.3
      fiber: 2.6

meals:
  - user: 1
    date: 2024-06-01
    type: breakfast
    info:
      name: "Oatmeal with Banana"
      description: "A healthy breakfast option"
      people: 1
    ingredients:
      - id: 1
        quantity: 40
      - id: 2
        quantity: 1

menus:
  - name: "Healthy Start"
    description: "A nutritious breakfast menu"
    ingredients:
      - id: 1
        quantity: 40
      - id: 2
        quantity: 1
    recipe:
      cooking_time: 10
      steps:
        - preparation_time: 5
          preparation_type: "active"
          description: "Cook oatmeal with water or milk."

