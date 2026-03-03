<script>
    import { useRoute } from "vue-router";

    export default {
        components: {},
        setup() {
            const route = useRoute();
            return { route };
        },
    };
</script>

<template>
    <div>
        <router-view></router-view>
    </div>
</template>

<style scoped></style>