package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Incoming request: %v\n", r.URL)
		keys, ok := r.URL.Query()["schema"]

		if !ok || len(keys[0]) < 1 {
			fmt.Fprintf(w, "schema name missing")
			return
		}
		schema := keys[0]
		fmt.Println(schema)
		if schema == "api" {
			apiSchema, _ := ioutil.ReadFile("./schema/kyma-schema.json")
			fmt.Fprintf(w, string(apiSchema))
		} else if schema == "kubeless" {
			kubelessSchema, _ := ioutil.ReadFile("./schema/kubeless-schema.json")
			fmt.Fprintf(w, string(kubelessSchema))

		}
	})
	fmt.Println("Schema server listening on 8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}

func check(err error) {
	if err != nil {
		panic(err)
	}
}
