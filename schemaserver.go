package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	data, _ := ioutil.ReadFile("./schema/kyma-schema.json")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, string(data))
	})
	fmt.Println("Schema server listening on 8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}
